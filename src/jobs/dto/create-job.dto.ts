import { IsIn, IsOptional, IsUrl, Matches } from 'class-validator';

export class CreateJobDto {
  @IsUrl()
  @Matches(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/, {
    message: 'repoUrl must be a GitHub repository URL',
  })
  repoUrl: string;

  // PUBLIC analyses appear on the Explore page
  @IsOptional()
  @IsIn(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';
}
