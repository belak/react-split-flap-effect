import PropTypes from "prop-types";
import React, { useEffect, useState, useCallback } from "react";

import { Presets } from "./Presets";
import { FlapDigit } from "./FlapDigit";
import { registerCallback, clearCallback } from './callbacks'

const Modes = {
  Numeric: "num",
  Alphanumeric: "alpha",
};

const splitChars = (v) =>
  String(v)
    .split("")
    .map((c) => c.toUpperCase());

const padValue = (v, length, padChar, padStart) => {
  const trimmed = v.slice(0, length);
  return padStart
    ? String(trimmed).padStart(length, padChar)
    : String(trimmed).padEnd(length, padChar);
};

export const FlapDisplay = ({
  id,
  className,
  css,
  value,
  chars,
  length,
  padChar,
  padMode,
  timing,
  ...restProps
}) => {
  const [stack, setStack] = useState([]);
  const [mode, setMode] = useState(Modes.Numeric);
  const [cursor, setCursor] = useState([]);
  const [digits, setDigits] = useState([]);
  const [clean, setClean] = useState(false);

  useEffect(() => {
    setStack(splitChars(chars));
    setMode(chars.match(/[a-z]/i) ? Modes.Alphanumeric : Modes.Numeric);
  }, [chars]);

  useEffect(() => {
    const padStart =
      padMode === "auto" ? !!value.match(/^[0-9.,+-]*$/) : padMode === "start";

    setDigits(splitChars(padValue(value, length, padChar, padStart)));

    // When the value changes, mark it as not clean, otherwise it will never
    // display.
    setClean(false);
  }, [value, chars, length, padChar, padMode]);

  // On tick, update all the chars. We need to have this in a ref to make it
  // easier to pass it around with setInterval.
  const increment = useCallback(() => {
    setCursor(
      digits.map((item, idx) => {
        if (!cursor[idx]) {
          return {
            current: 0,
            prev: 0,
            target: item,
          };
        }

        const cur = cursor[idx];

        if (item != cur.target) {
          return {
            ...cur,
            target: item,
          };
        }

        if (stack[cur.current] === cur.target) {
          return cur;
        }

        return {
          ...cur,
          prev: cur.current,
          current: (cur.current + 1) % stack.length,
        };
      })
    );

    setClean(
      digits.reduce((prev, item, idx) => {
        const cur = cursor[idx] || {};
        return prev && stack[cur.current] === item;
      }, true)
    );
  }, [setCursor, cursor, stack, digits]);

  // Call increment once on start and on every tick. Note that we are explicitly
  // not depending on increment in useEffect or it will call it when it
  // shouldn't.
  useEffect(increment, []);

  useEffect(() => {
    // If it's clean, we don't don't need to start the ticker.
    if (clean) return;

    const handle = registerCallback(increment, timing);

    return () => {
      clearCallback(handle);
    };
  }, [increment, timing, clean]);

  return (
    <div
      id={id}
      className={className}
      css={css}
      aria-hidden="true"
      aria-label={value}
    >
      {cursor.map((item, idx) => (
        <FlapDigit
          key={idx}
          value={stack[item.current]}
          prevValue={stack[item.previous]}
          final={stack[item.current] === item.target}
          mode={mode}
          {...restProps}
        />
      ))}
    </div>
  );
};

FlapDisplay.defaultProps = {
  chars: Presets.NUM,
  padChar: " ",
  timing: 30,
  hinge: true,
  padMode: "auto",
};

FlapDisplay.propTypes = {
  id: PropTypes.string,
  css: PropTypes.object,
  className: PropTypes.string,
  value: PropTypes.string.isRequired,
  chars: PropTypes.string,
  length: PropTypes.number,
  padChar: PropTypes.string,
  padMode: PropTypes.string,
  timing: PropTypes.number,
  hinge: PropTypes.bool,
};
