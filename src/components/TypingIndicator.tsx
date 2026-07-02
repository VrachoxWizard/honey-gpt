import { memo, useState } from 'react';
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

export const TypingIndicator = memo(function TypingIndicator() {
  const [message] = useState(
    () => SCRIBING_MESSAGES[Math.floor(Math.random() * SCRIBING_MESSAGES.length)]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[720px] mx-auto flex items-center gap-3 px-1"
    >
      <SaintPortrait size={28} halo />
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1" aria-hidden="true">
          <span className="ember-dot" />
          <span className="ember-dot" />
          <span className="ember-dot" />
        </div>
        <span className="font-display italic text-[15px] shimmer-gold-text flex items-center gap-2">
          <Feather size={13} className="text-gold-bright animate-quill shrink-0" />
          Haničar {message}
        </span>
      </div>
    </motion.div>
  );
});
