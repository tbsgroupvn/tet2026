import { useMemo } from 'react';
import { getRandomCultureTip } from '../utils/tbsQuiz';

export default function CultureTipCard() {
  const tip = useMemo(() => getRandomCultureTip(), []);

  return (
    <div className="culture-tip-ingame">
      <span className="culture-tip-ingame-label">💡 Bạn có biết?</span>
      <p className="culture-tip-ingame-text">{tip}</p>
    </div>
  );
}
