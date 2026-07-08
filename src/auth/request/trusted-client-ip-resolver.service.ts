import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isIP } from 'net';
import { AuthenticatedRequest } from './authenticated-request.interface';

const FORWARDED_HEADER = 'forwarded';
const X_FORWARDED_FOR_HEADER = 'x-forwarded-for';
const SINGLE_IP_HEADERS = [
  'x-real-ip',
  'true-client-ip',
  'cf-connecting-ip',
  'fastly-client-ip',
];

/**
 * Resolves a trusted forwarded client IP from an HTTP request.
 *
 * The service deliberately ignores all forwarded client-IP headers unless
 * `app.trustForwardedClientIp` is enabled. When trusted, it accepts only one
 * exact IPv4 or IPv6 host value and returns it without CIDR, wildcard, port, or
 * list syntax so downstream moderation can safely compare exact hosts.
 */
@Injectable()
export class TrustedClientIpResolverService {
  /**
   * Creates a trusted client-IP resolver.
   *
   * @param configService Nest configuration service containing app trust flags.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Resolves the first trusted forwarded client IP for a request.
   *
   * @param request Authenticated request carrying raw HTTP headers.
   * @returns Bare IPv4/IPv6 host value, or `undefined` when not trusted or invalid.
   * @throws Does not throw.
   */
  resolve(request: AuthenticatedRequest): string | undefined {
    if (!this.configService.get<boolean>('app.trustForwardedClientIp', false)) {
      return undefined;
    }

    const forwardedFor = this.readFirstHeaderValue(
      request,
      X_FORWARDED_FOR_HEADER,
    );
    const firstForwardedFor = forwardedFor?.split(',')[0];
    const xForwardedCandidate = this.normalizeExactHost(firstForwardedFor);

    if (xForwardedCandidate) {
      return xForwardedCandidate;
    }

    const forwarded = this.resolveForwardedForHeader(
      this.readFirstHeaderValue(request, FORWARDED_HEADER),
    );

    if (forwarded) {
      return forwarded;
    }

    for (const headerName of SINGLE_IP_HEADERS) {
      const candidate = this.normalizeExactHost(
        this.readFirstHeaderValue(request, headerName),
      );

      if (candidate) {
        return candidate;
      }
    }

    return undefined;
  }

  /**
   * Reads a single raw header value from Express request headers.
   *
   * @param request Authenticated request carrying raw HTTP headers.
   * @param headerName Lowercase header name to read.
   * @returns First header value when present.
   * @throws Does not throw.
   */
  private readFirstHeaderValue(
    request: AuthenticatedRequest,
    headerName: string,
  ): string | undefined {
    const value = request.headers[headerName];

    if (Array.isArray(value)) {
      return value[0];
    }

    return value;
  }

  /**
   * Extracts and normalizes the first RFC 7239 `for` value.
   *
   * @param header Raw `Forwarded` header value.
   * @returns Bare IPv4/IPv6 host value, or `undefined` when absent or invalid.
   * @throws Does not throw.
   */
  private resolveForwardedForHeader(
    header: string | undefined,
  ): string | undefined {
    const firstEntry = header?.split(',')[0];

    if (!firstEntry) {
      return undefined;
    }

    const forPair = firstEntry
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.toLowerCase().startsWith('for='));

    if (!forPair) {
      return undefined;
    }

    return this.normalizeExactHost(forPair.slice(4));
  }

  /**
   * Normalizes a candidate into a single exact IPv4 or IPv6 host.
   *
   * @param rawValue Header fragment that may contain quotes or IPv6 brackets.
   * @returns Bare host value accepted by Node's IP parser, or `undefined`.
   * @throws Does not throw.
   */
  private normalizeExactHost(rawValue: string | undefined): string | undefined {
    let value = rawValue?.trim();

    if (!value) {
      return undefined;
    }

    if (
      value.includes('/') ||
      value.includes('*') ||
      value.includes(',') ||
      value.toLowerCase() === 'unknown'
    ) {
      return undefined;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1).trim();
    }

    const bracketedIpv6 = value.match(/^\[([^\]]+)\](?::\d+)?$/);

    if (bracketedIpv6) {
      value = bracketedIpv6[1];
    } else {
      const ipv4WithPort = value.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);

      if (ipv4WithPort) {
        value = ipv4WithPort[1];
      }
    }

    return isIP(value) ? value : undefined;
  }
}
