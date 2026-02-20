export type PlanComparisonStat = {
  label: string;
  value: string | number;
};

export type PlanComparisonHighlight = {
  label: string;
  variant: 'info' | 'warning' | 'success';
  items?: string[];
};

export type PlanComparisonDialogProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  stats: PlanComparisonStat[];
  highlights?: PlanComparisonHighlight[];
  buttonLabel?: string;
  showConfetti?: boolean;
  onClose?: () => void;
};
