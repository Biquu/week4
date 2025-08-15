import { create } from "zustand";

export const useAuthStore = create((set) => ({
	ticketId: null,
	isAuthenticated: false,
	setTicket: (ticketId) =>
		set({ ticketId, isAuthenticated: Boolean(ticketId) }),
	logout: () => set({ ticketId: null, isAuthenticated: false }),
}));


