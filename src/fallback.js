// Shown instantly while the server answers, so students never stare at a loader.
// KEEP IN SYNC with server/config.js (prices and payees). The server still validates every order.
export const FALLBACK = {
  prices: { snacks: 79, comboOffer: 239, comboRegular: 259 },
  payees: [
    { id: 1, name: 'Gokulan Mannu', vpa: '9585220050@ptsbi' },
    { id: 2, name: 'Gokulan Mannu 2', vpa: 'gokultamil005@okhdfcbank' },
   // { id: 0, name: 'ARVIND M', vpa: 'arvindms2017-2@okaxis' },
  ],
};
