import { create } from 'zustand';

interface BetSelection {
  matchId: string;
  marketId: string;
  oddId: string;
  matchName: string;
  marketName: string;
  selection: string;
  oddsValue: number;
}

interface BetSlipState {
  selections: BetSelection[];
  stake: number;
  betType: 'single' | 'accumulator';
  useBonus: boolean;
  addSelection: (selection: BetSelection) => void;
  removeSelection: (oddId: string) => void;
  clearSlip: () => void;
  setStake: (stake: number) => void;
  setBetType: (type: 'single' | 'accumulator') => void;
  toggleBonus: () => void;
}

export const useBetSlipStore = create<BetSlipState>((set) => ({
  selections: [],
  stake: 100,
  betType: 'single',
  useBonus: false,
  addSelection: (sel) => set((state) => {
    // Check if match already exists (prevent placing multiple bets on same match on accumulator)
    const filtered = state.selections.filter((s) => s.matchId !== sel.matchId);
    return {
      selections: [...filtered, sel],
      betType: [...filtered, sel].length > 1 ? 'accumulator' : 'single',
    };
  }),
  removeSelection: (oddId) => set((state) => {
    const remaining = state.selections.filter((s) => s.oddId !== oddId);
    return {
      selections: remaining,
      betType: remaining.length > 1 ? 'accumulator' : 'single',
    };
  }),
  clearSlip: () => set({ selections: [], stake: 100, betType: 'single', useBonus: false }),
  setStake: (stake) => set({ stake }),
  setBetType: (betType) => set({ betType }),
  toggleBonus: () => set((state) => ({ useBonus: !state.useBonus })),
}));

interface AuthState {
  token: string | null;
  user: any | null;
  setAuth: (token: string | null, user: any | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  setAuth: (token, user) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');

    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');

    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  }
}));
