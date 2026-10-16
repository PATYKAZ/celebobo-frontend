/** Programme de fidélité par points. */
export type PointBalance = {
  total: number;
  available: number;
  pending: number;
};

export type PointTransaction = {
  id: number;
  points: number;
  reason: string;
  ruleId: number | null;
  ruleName: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
};
