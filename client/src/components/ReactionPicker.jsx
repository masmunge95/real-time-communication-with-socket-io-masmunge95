import React, { useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

const EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

const ReactionPicker = ({ onSelect, close, targetRef }) => {
  const pickerRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (targetRef.current && pickerRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      const pickerRect = pickerRef.current.getBoundingClientRect();

      let top = targetRect.top - pickerRect.height - 8; // 8px margin
      let left = targetRect.left + (targetRect.width / 2) - (pickerRect.width / 2);

      // Prevent going off-screen top
      if (top < 0) {
        top = targetRect.bottom + 8;
      }

      setPosition({ top, left });
    }
  }, [targetRef]);

  return ReactDOM.createPortal(
    <div ref={pickerRef} className="reaction-picker" style={{ top: position.top, left: position.left }}>
      {EMOJIS.map((emoji) => (
        <button key={emoji} onClick={() => onSelect(emoji)}>
          {emoji}
        </button>
      ))}
    </div>,
    document.body
  );
};

export default ReactionPicker;