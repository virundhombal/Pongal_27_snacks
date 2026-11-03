// Menu content from the posters. Image files go in public/assets/ (see README of assets):
//   snacks/<id>.webp  and  feast/<id>.webp. A missing image just shows a plain circle.
// caption: true = the photo has no name on it, so the page adds one underneath
// Tapping a dish opens a web search about it. Give a URL as a 3rd argument to link a specific page instead, or null for no link.
const search = (name) => `https://www.google.com/search?q=${encodeURIComponent(`${name} Tamil Nadu food`)}`;
const linkFor = (name, custom) => (custom === undefined ? search(name) : custom);
const s = (id, name, custom) => ({ id, name, img: `snacks/${id}.webp`, caption: true, link: linkFor(name, custom) });
const f = (id, name, custom) => ({ id, name, img: `feast/${id}.webp`, link: linkFor(name, custom) });

export const SNACKS = {
  title: 'Diwali × Pongal Snacks',
  info: { venue: 'Main Mess', date: '12 Nov 2026', time: '5:00 PM onwards' },
  items: [{ ...s('kothu-parotta', 'Kothu Parotta'), veg: true }, s('soda-sarbath', 'Soda Sarbath')],
};

export const FEAST = {
  title: 'Pongal 2027 Virundhu',
  info: { venue: 'Main Mess', date: '3 Feb 2027', time: '12 PM onwards' },
  sections: [
    {
      name: 'Main course',
      items: [
        f('white-rice', 'White Rice'), f('vathakuzhambu', 'Vathakuzhambu'), f('puliotharai', 'Puliotharai'),
        f('drumstick-sambar', 'Drumstick Sambar'), f('tomato-rasam', 'Tomato Rasam'), f('buttermilk', 'Buttermilk'),
      ],
    },
    {
      name: 'Traditional accompaniments',
      items: [
        f('bottle-gourd-dal', 'Bottle Gourd Dal'), f('carrot-beans-cabbage-fry', 'Carrot-Beans-Cabbage Fry'),
        f('bittergourd-thogayal', 'Bittergourd Thogayal'), f('medu-vadai', 'Medu Vadai'),
        f('coriander-chutney', 'Coriander Chutney'), f('tomato-chutney', 'Tomato Chutney'),
      ],
    },
    {
      name: 'Sides',
      items: [
        f('appalam', 'Appalam'), f('paruppu-podi', 'Paruppu Podi'), f('dried-curd-chilli', 'Dried Curd Chilli'),
        f('mango-pickle', 'Mango Pickle'), f('pulichakeerai-pickle', 'Pulichakeerai Pickle'), f('salt', 'Salt', null),
      ],
    },
    {
      name: 'Sweets',
      items: [f('kachayam', 'Kachayam'), f('rava-pineapple-kesari', 'Rava-Pineapple Kesari'), f('kalkandu-sombu', 'Kalkandu & Sombu')],
    },
    { name: 'Beverage', items: [f('panagam', 'Panagam'), f('nannari-sarbath', 'Nannari Sarbath')] },
  ],
};
