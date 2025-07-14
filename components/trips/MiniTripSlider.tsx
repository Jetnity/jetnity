'use client'

import React from 'react'

const trips = [
  {
    title: '3 Tage in Lissabon',
    tags: ['Strand', 'Food', 'Kultur'],
    image: '/trip1.jpg',
  },
  {
    title: 'Kurztrip: Amsterdam',
    tags: ['Fahrrad', 'Kunst', 'Kanal'],
    image: '/trip2.jpg',
  },
  {
    title: 'Wandern in Zermatt',
    tags: ['Natur', 'Berge', 'Schweiz'],
    image: '/trip3.jpg',
  },
]

export default function MiniTripSlider() {
  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-semibold mb-4">Mini-Reiseideen</h2>
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {trips.map((trip, index) => (
            <div
              key={index}
              className="min-w-[240px] bg-white rounded-xl shadow p-4 flex-shrink-0"
            >
              <img
                src={trip.image}
                alt={trip.title}
                className="w-full h-32 object-cover rounded-md mb-2"
              />
              <h3 className="text-lg font-medium">{trip.title}</h3>
              <div className="text-sm text-gray-500">{trip.tags.join(', ')}</div>
              <button className="mt-2 text-sm text-blue-600 hover:underline">
                Jetzt entdecken
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
