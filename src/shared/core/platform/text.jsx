import React from 'react';

export const renderBracketHighlightedText = (text = '') => {
    const source = String(text || '');
    if (!source) return null;

    return source.split(/(\[[^\]]+\])/g).map((part, idx) => {
        const isHighlighted = /^\[[^\]]+\]$/.test(part);
        const cleanPart = isHighlighted ? part.slice(1, -1) : part;

        const renderedLines = cleanPart.split('\n').map((line, lineIdx, arr) => (
            <React.Fragment key={`${idx}-${lineIdx}`}>
                {line}
                {lineIdx !== arr.length - 1 && <br />}
            </React.Fragment>
        ));

        if (!isHighlighted) {
            return <React.Fragment key={idx}>{renderedLines}</React.Fragment>;
        }

        return (
            <mark
                key={idx}
                className="bg-yellow-200 text-yellow-950 px-2 py-1 rounded-lg border border-yellow-400 shadow-sm font-black"
                title="موضع السؤال داخل القطعة"
            >
                {renderedLines}
            </mark>
        );
    });
};

