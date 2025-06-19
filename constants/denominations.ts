export const CHIP_DENOMINATIONS = [
  // High rollers
  { value: 1000000, color: 'bg-amber-700',  textColor: 'black', name: '$1M'   },
  { value: 500000,  color: 'bg-violet-700', textColor: 'white', name: '$500K' },
  { value: 100000,  color: 'bg-rose-600',   textColor: 'white', name: '$100K' },
  { value: 50000,   color: 'bg-emerald-700',textColor: 'white', name: '$50K'  },
  { value: 25000,   color: 'bg-emerald-500',textColor: 'white', name: '$25K'  },
  { value: 20000,   color: 'bg-teal-600',   textColor: 'white', name: '$20K'  },

  // Thousands
  { value: 10000,   color: 'bg-orange-600', textColor: 'white', name: '$10K'  },
  { value: 5000,    color: 'bg-amber-400',  textColor: 'black', name: '$5K'   },
  { value: 2500,    color: 'bg-lime-500',   textColor: 'black', name: '$2.5K' },
  { value: 1000,    color: 'bg-gray-900',   textColor: 'white', name: '$1K'   },

  // Hundreds
  { value: 500,     color: 'bg-purple-600', textColor: 'white', name: '$500'  },
  { value: 250,     color: 'bg-indigo-500', textColor: 'white', name: '$250'  },
  { value: 100,     color: 'bg-red-600',    textColor: 'white', name: '$100'  },

  // Pocket change
  { value: 50,      color: 'bg-orange-400', textColor: 'black', name: '$50'   },
  { value: 25,      color: 'bg-green-600',  textColor: 'white', name: '$25'   },
  { value: 10,      color: 'bg-blue-500',   textColor: 'white', name: '$10'   },
  { value: 5,       color: 'bg-yellow-400', textColor: 'black', name: '$5'    },
  { value: 1,       color: 'bg-cyan-400',   textColor: 'black', name: '$1'    }
];

export const getChipStyle = (value: number) => {
  // Handle penny chips (any value less than $1)
  if (value < 1) {
    return { value, color: 'bg-gray-300', textColor: 'black', name: `${Math.round(value * 100)}¢` };
  }
  
  const found = CHIP_DENOMINATIONS.find(d => d.value === value);
  if (!found) {
    console.warn(`No chip style found for value: ${value}`);
    return CHIP_DENOMINATIONS[17]; // 🔥 FIXED: $1 chip is now at index 17
  }
  return found;
};