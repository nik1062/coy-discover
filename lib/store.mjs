// Tiny JSON-file store. All "who liked me" data lives in `likesMe` and is NEVER returned by any API.
import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_FILE = path.join(process.cwd(), 'data', 'db.json');
const NAMES = ['Aarav','Diya','Kabir','Meera','Rohan','Ananya','Vihaan','Ishita','Arjun','Saanvi','Reyansh','Kiara','Aditya','Myra','Dev','Tara','Neil','Zoya','Karan','Riya','Yash','Navya','Ishaan','Pari','Samar','Anika','Veer','Aisha','Rudra','Sia','Laksh','Mahi'];
const PLACES = ['IIT Delhi','Delhi University','Gurgaon','Anna University, Chennai','Bangalore','Mumbai','BITS Pilani','Pune','Hyderabad','Jaipur','Kolkata','Noida'];
const BIOS = ['Chai over coffee, always.','Will trade my playlist for yours.','Weekend trekker, weekday overthinker.','Looking for someone to split fries with.','Probably reading or at a gig.','Dog person. Terrible at texting back.','Cricket on TV, biryani on the table.','Ask me about my startup idea (or don’t).'];
const INTERESTS = ['Music','Travel','Coding','Cricket','Movies','Food','Photography','Gaming','Books','Fitness','Art','Dance','Trekking','Anime'];

export function seedData() {
  const profiles = NAMES.map((name, i) => ({
    id: i + 1,
    name,
    age: 19 + (i % 8),
    photo: `https://i.pravatar.cc/600?img=${(i % 70) + 1}`,
    bio: BIOS[i % BIOS.length],
    place: PLACES[i % PLACES.length],
    interests: [0, 3, 7].map((k) => INTERESTS[(i * 3 + k) % INTERESTS.length]),
  }));
  // Every 4th profile (8 of 32) has already liked the logged-in user.
  const likesMe = profiles.filter((p) => p.id % 4 === 2).map((p) => p.id);
  return { profiles, likesMe, swipes: {}, matches: [] };
}

const httpError = (status, message) => Object.assign(new Error(message), { status });

export function createStore(file = DEFAULT_FILE) {
  const write = (d) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(d, null, 2));
  };
  const read = () => {
    if (!fs.existsSync(file)) write(seedData());
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  };
  return {
    feed() {
      const d = read();
      return d.profiles.filter((p) => !d.swipes[p.id]);
    },
    swipe(profileId, direction) {
      const id = Number(profileId);
      if (!Number.isInteger(id)) throw httpError(400, 'profileId must be an integer');
      if (direction !== 'like' && direction !== 'pass') throw httpError(400, 'direction must be "like" or "pass"');
      const d = read();
      const profile = d.profiles.find((p) => p.id === id);
      if (!profile) throw httpError(404, 'Profile not found');
      if (d.swipes[id]) { // idempotent: a profile can only be swiped once
        const matched = d.matches.includes(id);
        return { matched, profile: matched ? profile : null, duplicate: true };
      }
      d.swipes[id] = direction;
      const matched = direction === 'like' && d.likesMe.includes(id);
      if (matched) d.matches.push(id);
      write(d);
      return { matched, profile: matched ? profile : null, duplicate: false };
    },
    matches() {
      const d = read();
      return d.matches.map((id) => d.profiles.find((p) => p.id === id));
    },
    reset() { write(seedData()); },
  };
}

export const store = createStore();
