import { api } from '@/services/api'
import { adaptAuctionsList } from './auctions-list.adapter'
import type { AuctionListItemDto } from './auctions-list.dto'
import type { AuctionsListService } from './auctions-list.service'
import type { AuctionListItem, AuctionsListQuery } from './auctions-list.types'

export const auctionsListHttpService: AuctionsListService = {
  async listAuctions(query: AuctionsListQuery): Promise<AuctionListItem[]> {
    const params = new URLSearchParams({ status: query.status })
    const dto = await api<AuctionListItemDto[]>(`/auctions?${params.toString()}`)
    return adaptAuctionsList(dto)
  },
}
