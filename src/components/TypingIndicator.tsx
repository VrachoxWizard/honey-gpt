import { useState } from 'react';
import { motion } from 'framer-motion';
import { Feather } from 'lucide-react';
import { SaintPortrait } from './SaintPortrait';

const SCRIBING_MESSAGES = [
  'upisuje uz Božju pomoć…',
  'moli krunicu za točan odgovor…',
  'konzultira se sa svecima…',
  'umače pero u sveto crnilo…',
  'lista po Svetom pismu…',
  'pali svijeću i razmišlja…',
  'prevodi s latinskog…',
  'zaziva Duha Svetoga…',
  'provjerava kod župnika…',
  'briše prašinu sa šahovnice…',
  'traži blagoslov za odgovor…',
  'šalje golubicu po mudrost…',
  'razmišlja uz tamjan…',
  'trese lampu da izađe mudrost…',
];

export function TypingIndicator() {
  const [message] = useState(
    () => SCRIBING_MESSAGES[Math.floor(Math.random() * SCRIBING_MESSAGES.length)]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[720px] mx-auto"
    >
      <div className="rule-gold mb-4 opacity-50" />
      <div className="flex items-center gap-2.5">
        <SaintPortrait size={24} />
        <span className="font-display italic text-[15px] text-ink-soft flex items-center gap-2">
          <Feather size={13} className="text-oxblood animate-quill" />
          Haničar {message}
        </span>
      </div>
    </motion.div>
  );
}
