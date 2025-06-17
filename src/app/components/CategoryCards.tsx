'use client';

export default function CategoryCards() {
  const categories = [
    {
      name: 'FASHION',
      link: '/shop/list?category=fashion',
    },
    {
      name: 'SHOES',
      link: '/shop/list?category=shoes',
    },
    {
      name: 'OTHERS',
      link: '/shop/list?category=others',
    },
  ];

  return (
    <div className='mt-16 flex flex-col items-center justify-center gap-10 text-center lg:flex-row lg:gap-10'>
      {categories.map((category, index) => (
        <div
          key={index}
          className='shadow-card hover:shadow-card-hover relative h-96 w-72 cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-3 lg:h-96 lg:w-80'
        >
          <div className='from-dark-secondary absolute inset-0 bg-gradient-to-br to-gray-700'></div>
          <a
            href={category.link}
            className='relative z-10 flex h-full flex-col items-center justify-center text-white'
          >
            <div className='bg-primary mb-8 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white'>
              U
            </div>
            <div className='mb-4 text-3xl font-light tracking-wider'>{category.name}</div>
            <div className='text-base font-light tracking-wide opacity-80'>DESIGN</div>
          </a>
        </div>
      ))}
    </div>
  );
}
