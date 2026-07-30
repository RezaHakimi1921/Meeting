import { useEffect, useState } from 'react';
import { Text } from 'react-native';

/**
 * Types text character-by-character like handwriting on a letter.
 */
export default function TypewriterText({ text = '', style, cps = 28, onDone }) {
  const [shown, setShown] = useState('');

  useEffect(() => {
    setShown('');
    if (!text) return undefined;
    let i = 0;
    const ms = Math.max(12, Math.floor(1000 / cps));
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        onDone?.();
      }
    }, ms);
    return () => clearInterval(id);
  }, [text, cps, onDone]);

  return <Text style={style}>{shown}</Text>;
}
