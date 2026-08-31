import { Column, Entity, PrimaryColumn } from 'typeorm';

// Single-row table holding platform-wide settings.
@Entity('platform_settings')
export class PlatformSetting {
  @PrimaryColumn({ default: 1 })
  id!: number;

  @Column({ default: false })
  microJobAutoApprove!: boolean;
}
