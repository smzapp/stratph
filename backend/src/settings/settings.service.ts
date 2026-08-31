import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSetting } from './platform-setting.entity.js';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(PlatformSetting)
    private readonly settingsRepo: Repository<PlatformSetting>,
  ) {}

  async get(): Promise<PlatformSetting> {
    let settings = await this.settingsRepo.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = await this.settingsRepo.save(
        this.settingsRepo.create({ id: 1, microJobAutoApprove: false }),
      );
    }
    return settings;
  }

  async update(patch: Partial<Pick<PlatformSetting, 'microJobAutoApprove'>>): Promise<PlatformSetting> {
    const settings = await this.get();
    Object.assign(settings, patch);
    return this.settingsRepo.save(settings);
  }
}
