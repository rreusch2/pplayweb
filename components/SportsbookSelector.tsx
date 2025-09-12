'use client'
import React from 'react';

interface Bookmaker {
    key: string;
    title: string;
}

interface SportsbookSelectorProps {
    bookmakers: Bookmaker[];
    selectedBook: Bookmaker | null | undefined;
    onSelectBook: (book: Bookmaker) => void;
}

const SportsbookSelector: React.FC<SportsbookSelectorProps> = ({ bookmakers, selectedBook, onSelectBook }) => {
    const hasBooks = Array.isArray(bookmakers) && bookmakers.length > 0;
    if (!hasBooks) {
        return (
            <div className="mt-4">
                <select className="w-full bg-gray-800 text-gray-400 text-sm rounded-lg p-2 border border-gray-700" disabled>
                    <option>No sportsbooks available</option>
                </select>
            </div>
        );
    }

    const value = selectedBook?.key ?? bookmakers[0].key;
    return (
        <div className="mt-4">
            <select
                value={value}
                onChange={(e) => {
                    const book = bookmakers.find(b => b.key === e.target.value);
                    if (book) {
                        onSelectBook(book);
                    }
                }}
                className="w-full bg-gray-800 text-white text-sm rounded-lg p-2 border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
            >
                {bookmakers.map(book => (
                    <option key={book.key} value={book.key}>{book.title}</option>
                ))}
            </select>
        </div>
    );
};

export default SportsbookSelector;
