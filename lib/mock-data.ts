import { PastDraw, Deposit, ChatMessage, UserGifs } from './types';

export const userGifs: UserGifs = {
  'Skylar': [
    'http://www.mysmiley.net/imgs/smile/cool/cool0012.gif',
    'http://www.mysmiley.net/imgs/smile/cool/cool0044.gif'
  ],
  'Luna': [
    'http://www.mysmiley.net/imgs/smile/party/party0011.gif',
    'http://www.mysmiley.net/imgs/smile/party/party0014.gif'
  ],
  'SolanaBull': [
    'http://www.mysmiley.net/imgs/smile/fighting/fighting0004.gif',
    'http://www.mysmiley.net/imgs/smile/evilgrin/evilgrin0002.gif'
  ],
  'Eclipse': [
    'http://www.mysmiley.net/imgs/smile/happy/happy0071.gif',
    'http://www.mysmiley.net/imgs/smile/happy/happy0126.gif'
  ],
  'Nebula': [
    'http://www.mysmiley.net/imgs/smile/japanese/jap.gif',
    'http://www.mysmiley.net/imgs/smile/love/love0042.gif'
  ]
};

const mockMessages: ChatMessage[] = [
  { id: '1', user: 'Skylar', message: 'gm', timestamp: '5:22 PM', gif: userGifs['Skylar'][0] },
  { id: '2', user: 'Luna', message: 'I deposited even more...', timestamp: '5:23 PM', gif: userGifs['Luna'][0] },
  { id: '3', user: 'SolanaBull', message: 'what a pot!', timestamp: '5:24 PM', gif: userGifs['SolanaBull'][0] },
  { id: '4', user: 'Eclipse', message: 'when is it drawing?', timestamp: '5:25 PM', gif: userGifs['Eclipse'][0] },
  { id: '5', user: 'Nebula', message: 'gm', timestamp: '5:26 PM', gif: userGifs['Nebula'][0] }
];

export const pastDraws: PastDraw[] = [
  { id: '1', name: 'Nova', amount: 1532.6 },
  { id: '2', name: 'Astro', amount: 920.1 },
  { id: '3', name: 'Orion', amount: 1088.5 },
];

const solPrice = 170
const getAmountUSD = (amount: number) => {
  return amount * solPrice;
}

export const currentDeposits: Deposit[] = [
  { id: '1', user: 'SolanaBull', token: 'SOL', amount: 250.5, amountUSD: getAmountUSD(250.5), color: 'hsl(var(--chart-1))', timestamp: new Date(Date.now() - 1800000) },
  { id: '2', user: 'Luna', token: 'RAY', amount: 320.8, amountUSD: getAmountUSD(320.8), color: 'hsl(var(--chart-2))', timestamp: new Date(Date.now() - 2700000) },
  { id: '3', user: 'Nebula', token: 'BONK', amount: 178.2, amountUSD: getAmountUSD(178.2), color: 'hsl(var(--chart-3))', timestamp: new Date(Date.now() - 1200000) },
  { id: '4', user: 'Eclipse', token: 'USDC', amount: 217.9, amountUSD: getAmountUSD(217.9), color: 'hsl(var(--chart-4))', timestamp: new Date(Date.now() - 900000) },
  { id: '5', user: 'Comet', token: 'WIF', amount: 145.3, amountUSD: getAmountUSD(145.3), color: 'hsl(var(--chart-1))', timestamp: new Date(Date.now() - 600000) },
  { id: '6', user: 'Meteor', token: 'SWIF', amount: 198.7, amountUSD: getAmountUSD(198.7), color: 'hsl(var(--chart-2))', timestamp: new Date(Date.now() - 300000) },
  { id: '7', user: 'Galaxy', token: 'JUP', amount: 263.4, amountUSD: getAmountUSD(263.4), color: 'hsl(var(--chart-3))', timestamp: new Date(Date.now() - 120000) },
];

export const chatMessages = mockMessages;

export const totalPotAmount = () => {
  return currentDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
};