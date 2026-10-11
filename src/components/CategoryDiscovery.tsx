import React from 'react';
import { BRAND_ASSETS } from '../data/products';
import { ArrowUpRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const CategoryDiscovery: React.FC = () => {
  const { setActiveCategory } = useShop();

  const categories = [
    {
      id: 'keychains',
      title: 'Charms & Keychains',
      subtitle: 'Miniature botanical wool blossoms with solid brass clips',
      count: '8 Designs',
      image: BRAND_ASSETS.crochetDaisyLeaf,
      colSpan: 'lg:col-span-4',
    },
    {
      id: 'bags',
      title: 'Handcrafted Bags',
      subtitle: 'Chunky looped totes, clutches, and everyday carry',
      count: '6 Silhouettes',
      image: BRAND_ASSETS.slouchyHobo,
      colSpan: 'lg:col-span-8',
    },
    {
      id: 'pouches',
      title: 'Embroidered Pouches',
      subtitle: '4mm organic wool felt with French knot floral embroidery',
      count: '5 Styles',
      image: BRAND_ASSETS.coinPurse,
      colSpan: 'lg:col-span-6',
    },
    {
      id: 'gifts',
      title: 'Giftable Keepsakes',
      subtitle: 'Letterpress packaged charm trios and personalized sets',
      count: '4 Curations',
      image: BRAND_ASSETS.giftBoxTrio,
      colSpan: 'lg:col-span-6',
    },
  ];

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[#EAE2D8]">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#8C827A] font-medium mb-2">
              Artisan Catalog
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-[#24211E] tracking-tight">
              Explore by Category
            </h2>
          </div>
          <p className="text-sm text-[#6B6158] max-w-md font-light">
            Every object is slowly hand-looped or needle-worked in limited studio editions.
          </p>
        </div>

        {/* Asymmetric Category Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`${cat.colSpan} group cursor-pointer relative rounded-2xl overflow-hidden bg-white border border-[#EAE2D8] hover:shadow-lg transition-all duration-300 min-h-[320px] flex flex-col justify-end p-6 sm:p-8`}
            >
              {/* Background Image with Dark Vignette */}
              <div className="absolute inset-0 z-0">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#24211E]/85 via-[#24211E]/40 to-transparent transition-opacity group-hover:opacity-90" />
              </div>

              {/* Text Layer over scrim */}
              <div className="relative z-10 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-widest text-[#E8B4B8] font-medium">
                    {cat.count}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#24211E] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-200">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="font-editorial text-2xl sm:text-3xl font-medium text-white mb-1 group-hover:translate-x-1 transition-transform">
                  {cat.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#FAF8F5]/80 font-light max-w-sm line-clamp-2">
                  {cat.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
