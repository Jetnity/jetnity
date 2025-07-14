'use client'

import Image from 'next/image'
import Link from 'next/link'

const inspirations = [
	{
		title: 'Abenteuer',
		image: '/images/inspiration-adventure.jpg',
		link: '/reiseideen/abenteuer',
	},
	{
		title: 'Romantik',
		image: '/images/inspiration-romantik.jpg',
		link: '/reiseideen/romantik',
	},
	{
		title: 'Citytrip',
		image: '/images/inspiration-city.jpg',
		link: '/reiseideen/citytrip',
	},
	{
		title: 'Natur',
		image: '/images/inspiration-natur.jpg',
		link: '/reiseideen/natur',
	},
]

export default function InspirationsGrid() {
	return (
		<section className="py-10 bg-white">
			<div className="max-w-6xl mx-auto px-4">
				<h2 className="text-2xl font-semibold mb-6">Inspiration entdecken</h2>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
					{inspirations.map((item) => (
						<Link
							key={item.title}
							href={item.link}
							className="group relative block overflow-hidden rounded-xl shadow hover:shadow-lg transition"
						>
							<Image
								src={item.image}
								alt={item.title}
								width={400}
								height={250}
								className="object-cover w-full h-[180px] transition-transform duration-300 group-hover:scale-105"
							/>
							<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white p-3">
								<div className="text-lg font-medium">{item.title}</div>
								<div className="text-sm opacity-80">Jetzt entdecken →</div>
							</div>
						</Link>
					))}
				</div>
			</div>
		</section>
	)
}
