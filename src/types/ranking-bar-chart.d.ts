declare module '@/components/ranking/RankingBarChart' {
  export interface BarRow {
    label: string
    sublabel?: string
    value: number
    displayValue: string
    href?: string
  }
}
