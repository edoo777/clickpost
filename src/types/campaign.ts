export interface Campaign {
  id: string;
  brandId: string;
  name: string;
  objective?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
}
