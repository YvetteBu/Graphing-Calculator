import './style.css';
import React, { useState, useRef, useEffect } from 'react';
import Plotly from 'plotly.js-dist';
import { create, all } from 'mathjs';

const math = create(all);

function App() {
  const [functions, setFunctions] = useState([{ id: 1, name: 'f(x)', expr: '', color: '#1f77b4' }]);
  const [selectedId, setSelectedId] = useState(1);
  const [keyboardMode, setKeyboardMode] = useState('symbols');
  const inputRef = useRef(null);

  // Re-render MathJax preview when expression changes
  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise();
    }
  }, [functions, selectedId]);

  // Draw empty grid on mount
  useEffect(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise();
    }

    // Draw empty grid
    Plotly.newPlot(
      'plot',
      [],
      {
        paper_bgcolor: '#0d0d0d',
        plot_bgcolor: '#0d0d0d',
        font: { color: 'white' },
        xaxis: {
          color: 'white',
          gridcolor: '#333',
          zerolinecolor: 'white',
          linecolor: 'white',
          tickcolor: 'white',
          range: [-10, 10]
        },
        yaxis: {
          color: 'white',
          gridcolor: '#333',
          zerolinecolor: 'white',
          linecolor: 'white',
          tickcolor: 'white',
          range: [-10, 10]
        },
        margin: { t: 20 }
      },
      {
        responsive: true,
        scrollZoom: true,
        displaylogo: false,
        modeBarButtonsToAdd: ['zoomIn2d', 'zoomOut2d', 'resetScale2d']
      }
    );
  }, []);

  const insertAtCursor = (text) => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const currentExpr = functions.find(f => f.id === selectedId)?.expr || '';
    const newValue = currentExpr.slice(0, start) + text + currentExpr.slice(end);
    const updated = functions.map(f =>
      f.id === selectedId ? { ...f, expr: newValue } : f
    );
    setFunctions(updated);
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + text.length;
    }, 0);
  };

  const handlePlot = () => {
    try {
      const data = functions.map((f) => {
        const expr = math.compile(
          f.expr
            .replace(/√/g, 'sqrt(')
            .replace(/\|([^\|]+)\|/g, 'abs($1)')
            .replace(/π/g, 'pi')
            .replace(/÷/g, '/')
            .replace(/×/g, '*')
            .replace(/−/g, '-')
            .replace(/([a-zA-Z\d)])(?=sqrt\()/g, '$1*')
        );

        const x = [], y = [];
        for (let i = -10; i <= 10; i += 0.1) {
          x.push(i);
          y.push(expr.evaluate({ x: i }));
        }

        return {
          x,
          y,
          name: f.name,
          type: 'scatter',
          mode: 'lines',
          line: { width: 2, color: f.color }
        };
      });

      Plotly.newPlot(
        'plot',
        data,
        {
          paper_bgcolor: '#0d0d0d',
          plot_bgcolor: '#0d0d0d',
          font: { color: 'white' },
          xaxis: {
            color: 'white',
            gridcolor: '#333',
            zerolinecolor: 'white',
            linecolor: 'white',
            tickcolor: 'white'
          },
          yaxis: {
            color: 'white',
            gridcolor: '#333',
            zerolinecolor: 'white',
            linecolor: 'white',
            tickcolor: 'white'
          },
          margin: { t: 20 },
          dragmode: 'pan'
        },
        {
          responsive: true,
          scrollZoom: true,
          displaylogo: false,
          modeBarButtonsToAdd: ['zoomIn2d', 'zoomOut2d', 'resetScale2d']
        }
      );
    } catch (err) {
      alert('Invalid expression. Try something like: sin(x), x^2, etc.');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Graphing Calculator</h2>
      <textarea
        ref={inputRef}
        style={{
          width: '300px',
          fontSize: '18px',
          padding: '8px 12px',
          height: '2.5em',
          backgroundColor: '#111',
          color: 'white',
          border: '1px solid #333',
          borderRadius: '6px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
        }}
        placeholder="Enter expression (e.g. sin(x), x^2)"
        value={functions.find(f => f.id === selectedId)?.expr || ''}
        onChange={(e) => {
          const updated = functions.map(f =>
            f.id === selectedId ? { ...f, expr: e.target.value } : f
          );
          setFunctions(updated);
        }}
      />
      <button
        style={{
          marginLeft: 10,
          backgroundColor: '#1e1e1e',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}
        onClick={handlePlot}
      >
        Plot
      </button>
      <div style={{ color: 'white', marginTop: '10px', minHeight: '2em' }}>
        <span>{'Preview: '}</span>
        <span id="preview-math">{`\\(${functions.find(f => f.id === selectedId)?.expr || ''}\\)`}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap', gap: '40px', marginTop: '30px' }}>
        <div id="plot" style={{ width: '600px', height: '400px' }}></div>
        {keyboardMode === 'symbols' && (
          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
            {/* Symbols Section */}
            <div>
              {[
                ['x', 'y', 'x²', 'x^y'],
                ['(', ')', '<', '>'],
                ['|a|', ',', '≤', '≥'],
                ['√', 'π']
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  {row.map((label) => (
                    <button
                      key={label}
                      style={{
                        backgroundColor: '#1e1e1e',
                        color: 'white',
                        fontSize: 'clamp(12px, 2vw, 16px)',
                        padding: '0.6rem',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: '60px'
                      }}
                      onClick={() => {
                        if (label === 'x²') insertAtCursor('^2');
                        else if (label === 'x^y') insertAtCursor('^');
                        else if (label === '√') {
                          insertAtCursor('sqrt()');
                          setTimeout(() => {
                            inputRef.current.selectionStart = inputRef.current.selectionEnd = inputRef.current.selectionStart - 1;
                          }, 0);
                        } else insertAtCursor(label);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ))}
              <button
                style={{
                  backgroundColor: '#555',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  padding: '0.6rem',
                  border: '1px solid #444',
                  borderRadius: '6px',
                  minWidth: '60px'
                }}
                onClick={() => setKeyboardMode(keyboardMode === 'symbols' ? 'abc' : 'symbols')}
              >
                {keyboardMode === 'symbols' ? 'ABC' : '123'}
              </button>
            </div>

            {/* Numbers Section */}
            <div>
              {[
                ['7', '8', '9', '÷'],
                ['4', '5', '6', '×'],
                ['1', '2', '3', '−'],
                ['0', '.', '=', '+']
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  {row.map((label) => (
                    <button
                      key={label}
                      style={{
                        backgroundColor: '#1e1e1e',
                        color: 'white',
                        fontSize: 'clamp(12px, 2vw, 16px)',
                        padding: '0.6rem',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: '60px'
                      }}
                      onClick={() => {
                        if (label === '÷') insertAtCursor('/');
                        else if (label === '×') insertAtCursor('*');
                        else if (label === '−') insertAtCursor('-');
                        else insertAtCursor(label);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Function Section */}
            <div>
              {[
                ['←', '→'],
                ['DEL'],
                ['ENTER']
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', justifyContent: 'center' }}>
                  {row.map((label) => (
                    <button
                      key={label}
                      style={{
                        backgroundColor: '#1e1e1e',
                        color: 'white',
                        fontSize: 'clamp(12px, 2vw, 16px)',
                        padding: '0.6rem',
                        border: '1px solid #444',
                        borderRadius: '6px',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: '60px'
                      }}
                      onClick={() => {
                        if (label === 'DEL') {
                          const currentExpr = functions.find(f => f.id === selectedId)?.expr || '';
                          const newExpr = currentExpr.slice(0, -1);
                          const updated = functions.map(f =>
                            f.id === selectedId ? { ...f, expr: newExpr } : f
                          );
                          setFunctions(updated);
                        } else if (label === 'ENTER') handlePlot();
                        else if (label === '→') {
                          const el = inputRef.current;
                          if (el) {
                            el.selectionStart = el.selectionEnd = Math.min(el.selectionStart + 1, (functions.find(f => f.id === selectedId)?.expr || '').length);
                            el.focus();
                          }
                        }
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {keyboardMode === 'abc' && (
          <div style={{ marginTop: '20px' }}>
            {[
              ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
              ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'θ'],
              ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
              ['↩', '!%', '[', ']', '{', '}', '~:', "',"]
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
                {row.map((key) => (
                  <button
                    key={key}
                    style={{
                      backgroundColor: '#1e1e1e',
                      color: 'white',
                      fontSize: 'clamp(12px, 2vw, 16px)',
                      padding: '0.6rem',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      minWidth: '40px'
                    }}
                    onClick={() => {
                      if (key === '↩') {
                        setKeyboardMode('symbols');
                      } else {
                        insertAtCursor(key);
                      }
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;