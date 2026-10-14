import { SetMetadata } from '@nestjs/common';

export const OPTIONAL_READ_KEY = 'forums:optional-read';

/** Allows missing tokens on policy-filtered reads while retaining validated-token scope checks.
 * @returns Nest route metadata consumed by TokenRolesGuard. @throws Never.
 */
export const OptionalRead = () => SetMetadata(OPTIONAL_READ_KEY, true);
