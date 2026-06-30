import { Injectable } from '@nestjs/common'

@Injectable()
export class CatalogService {
  getStatus(): string {
    return 'catalog module initialized'
  }
}
