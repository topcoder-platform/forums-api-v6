import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from '../../config/database.config';
import { DbModule } from '../../db/db.module';
import { VanillaChallengeLookupService } from './vanilla-challenge-lookup.service';
import { VanillaImportPreflightService } from './vanilla-import-preflight.service';
import { VanillaImportReportService } from './vanilla-import-report.service';
import { VanillaImportService } from './vanilla-import.service';
import { VanillaImportWriterService } from './vanilla-import-writer.service';
import { VanillaMemberMapperService } from './vanilla-member-mapper.service';
import { VanillaMysqlService } from './vanilla-mysql.service';
import { VanillaSourceReaderService } from './vanilla-source-reader.service';

/**
 * Standalone Nest root for the Vanilla import CLI.
 *
 * This module intentionally imports only configuration and the forums
 * `DbModule`, plus importer-local services. It does not load the HTTP
 * `AppModule`, auth providers, controllers, command services, or notification
 * publishers.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    DbModule,
  ],
  providers: [
    VanillaChallengeLookupService,
    VanillaImportPreflightService,
    VanillaImportReportService,
    VanillaImportService,
    VanillaImportWriterService,
    VanillaMemberMapperService,
    VanillaMysqlService,
    VanillaSourceReaderService,
  ],
})
export class VanillaImportModule {}
