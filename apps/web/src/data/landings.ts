/**
 * Посадочные страницы под рекламу и поиск: /novogodnie-podarki, /korporativnye-podarki, /merch, /welcome-pack.
 * Вся страница собирается из этих данных компонентом LandingPage.
 *
 * Правило: здесь только проверенные факты о Brillex. Цены, тиражи и сроки не выдумываем:
 * блоки offers и terms показываются, только когда в них есть данные.
 */

export interface LandingIdea {
  title: string
  text: string
  image: string
  alt: string
  /** Ссылка на подборку каталога, например /katalog/ruchki. */
  to?: string
}

export interface LandingWork {
  image: string
  /** Подпись под фото: «Клиент · что делали». */
  caption: string
}

/** Готовый набор с ценой. Заполнять только реальными наборами и ценами. */
export interface LandingOffer {
  title: string
  items: string
  priceFrom: string
  image?: string
}

/** Условия: минимальный тираж, сроки, крайний срок заказа. Пустые поля не показываются. */
export interface LandingTerms {
  minQty?: string
  leadTime?: string
  deadline?: string
}

export interface LandingFaq {
  q: string
  a: string
}

export interface Landing {
  path: string
  /** Источник заявки в CRM. */
  source: string
  seo: { title: string, description: string }
  eyebrow: string
  title: string
  titleAccent: string
  lead: string
  heroImage: string
  heroAlt: string
  whatsappText: string
  note?: string
  ideasTitle: string
  ideas: LandingIdea[]
  offers: LandingOffer[]
  terms: LandingTerms
  works: LandingWork[]
  faq: LandingFaq[]
}

/** Факты, которые верны для любой страницы. Источник: главная brillex.kz. */
export const LANDING_FACTS = [
  { value: 'Склад в Алматы', label: 'тысячи товаров в наличии' },
  { value: '10+ станков', label: 'своё производство нанесения' },
  { value: 'Фото образца', label: 'до запуска всего тиража' },
  { value: 'Отправка', label: 'по всему Казахстану' },
]

const WORKS = {
  russkiyDom: { image: '/pictures/portfolio/russkiy-dom.webp', caption: '«Русский дом» · набор: термос, блокнот, повербанк, ручка' },
  laska: { image: '/pictures/portfolio/laska.webp', caption: '«Ласка» · набор: термос, кружка, блокнот, ручка' },
  bosch: { image: '/pictures/portfolio/bosch.webp', caption: 'Bosch · зонт, кружка, бутылка, термокружка' },
  sds: { image: '/pictures/portfolio/sds.webp', caption: 'SDS · рюкзак, шопер, блокнот, поло' },
} satisfies Record<string, LandingWork>

const FAQ_COMMON: LandingFaq[] = [
  {
    q: 'Можно увидеть результат до запуска тиража?',
    a: 'Да. Сначала согласуем макет с вашим логотипом, потом отправим фото или видео первого образца. Тираж запускаем только после этого.',
  },
  {
    q: 'Сколько стоит нанесение логотипа?',
    a: 'Зависит от способа, изделия и тиража. Примерную сумму можно посчитать в калькуляторе на главной: например, УФ-печать на 100 ручках стоит 16 000 ₸, по 160 ₸ за штуку. Точную цену менеджер подтвердит после макета.',
  },
  {
    q: 'Что делать, если нужного товара нет на складе?',
    a: 'Привезём под заказ из Китая, России или Беларуси. Подберём вариант под ваш тираж, бюджет и сроки.',
  },
  {
    q: 'Работаете с другими городами?',
    a: 'Да. Производство и склад в Алматы, готовые заказы отправляем по всему Казахстану.',
  },
]

export const LANDINGS = {
  newYear: {
    path: '/novogodnie-podarki',
    source: 'landing-novogodnie-podarki',
    seo: {
      title: 'Новогодние корпоративные подарки с логотипом в Алматы',
      description: 'Новогодние подарки сотрудникам, клиентам и партнёрам с вашим логотипом. Наборы под бюджет, макет и фото образца до тиража, склад и производство в Алматы.',
    },
    eyebrow: 'Новый год',
    title: 'Новогодние подарки',
    titleAccent: 'с вашим логотипом',
    lead: 'Подберём под бюджет, нанесём логотип, соберём и упакуем наборы для команды, клиентов и партнёров. Склад и производство в Алматы, поэтому не ждём поставку из-за рубежа.',
    heroImage: '/carousel/set-black.webp',
    heroAlt: 'Новогодний набор: шопер, блокнот, бутылка и ланьярд с логотипом',
    whatsappText: 'Здравствуйте! Нужны новогодние подарки с логотипом. Количество: , бюджет на один подарок: ',
    note: 'Декабрь у всех самый загруженный. Чем раньше согласуем макет, тем спокойнее пройдёт тираж.',
    ideasTitle: 'Что подарить',
    ideas: [
      { title: 'Наборы для команды', text: 'Шопер, блокнот, бутылка и ручка в одном стиле. Собираем и упаковываем на нашем складе.', image: '/carousel/set-black.webp', alt: 'Чёрный набор: шопер, блокнот, бутылка', to: '/katalog/podarochnye-nabory' },
      { title: 'Клиентам и партнёрам', text: 'Термос, ежедневник, зонт. Вещи, которыми пользуются весь год, а не убирают в ящик после праздников.', image: '/carousel/set-blue.webp', alt: 'Синий набор: зонт, ежедневник, термос' },
      { title: 'Тёплый текстиль', text: 'Худи и свитшоты с вышивкой или печатью. Носят и зимой, и после.', image: '/pictures/hudi.webp', alt: 'Худи с логотипом', to: '/katalog/hudi' },
      { title: 'Ежедневники и блокноты', text: 'Тиснение, гравировка или печать. На складе больше 22 000 блокнотов.', image: '/pictures/notebooks.webp', alt: 'Ежедневники с логотипом', to: '/katalog/ezhednevniki' },
    ],
    // TODO: 2–3 реальных набора с составом и ценой «от» — блок появится сам
    offers: [],
    // TODO: минимальный тираж и крайний срок заказа к Новому году
    terms: { minQty: 'от 50 шт', deadline: '25 декабря' },
    works: [WORKS.russkiyDom, WORKS.laska, WORKS.bosch],
    faq: FAQ_COMMON,
  },

  corporateGifts: {
    path: '/korporativnye-podarki',
    source: 'landing-korporativnye-podarki',
    seo: {
      title: 'Корпоративные подарки с логотипом в Алматы',
      description: 'Подарки клиентам, партнёрам и сотрудникам с логотипом компании: наборы, термосы, ежедневники, ручки. Тысячи позиций на складе в Алматы, своё производство нанесения.',
    },
    eyebrow: 'Корпоративные подарки',
    title: 'Подарки с логотипом,',
    titleAccent: 'которыми пользуются',
    lead: 'Клиентам, партнёрам и сотрудникам: от ручки в футляре до собранного набора. Тысячи позиций на складе в Алматы и нанесение на собственном производстве.',
    heroImage: '/carousel/set-white.webp',
    heroAlt: 'Белый набор: шопер, термос, блокнот и ручка с логотипом',
    whatsappText: 'Здравствуйте! Нужны корпоративные подарки с логотипом. Для кого: , количество: ',
    ideasTitle: 'Что можно сделать',
    ideas: [
      { title: 'Готовые наборы', text: 'Несколько вещей в одном стиле: шопер, термос, блокнот, ручка. Комплектуем и упаковываем сами.', image: '/carousel/set-white.webp', alt: 'Белый набор с логотипом', to: '/katalog/podarochnye-nabory' },
      { title: 'Термосы и кружки', text: 'Печать или гравировка логотипа. Подарок, который каждый день стоит на столе.', image: '/pictures/portfolio/bosch.webp', alt: 'Термокружка и кружка Bosch', to: '/katalog/termosy' },
      { title: 'Ежедневники', text: 'Тиснение фольгой, слепое тиснение, гравировка, печать.', image: '/pictures/notebooks.webp', alt: 'Ежедневники с логотипом', to: '/katalog/ezhednevniki' },
      { title: 'Ручки', text: 'Больше 300 000 ручек на складе. Пластик, металл, soft-touch.', image: '/pictures/pens-fan.webp', alt: 'Ручки с логотипом', to: '/katalog/ruchki' },
    ],
    offers: [],
    terms: { minQty: 'от 50 шт' },
    works: [WORKS.bosch, WORKS.russkiyDom, WORKS.laska],
    faq: FAQ_COMMON,
  },

  merch: {
    path: '/merch',
    source: 'landing-merch',
    seo: {
      title: 'Корпоративный мерч с логотипом под ключ в Алматы',
      description: 'Мерч для компаний под ключ: одежда, сумки, посуда, аксессуары и полиграфия в одном стиле. Подбор, макет, нанесение на своём производстве, доставка по Казахстану.',
    },
    eyebrow: 'Мерч под ключ',
    title: 'Корпоративный мерч',
    titleAccent: 'в одном стиле',
    lead: 'Одежда, сумки, посуда, аксессуары и полиграфия. Подбираем, делаем макет, наносим на своём производстве и собираем коллекцию целиком, а не по одной вещи.',
    heroImage: '/pictures/portfolio/sds.webp',
    heroAlt: 'Мерч SDS: рюкзак, шопер, блокнот и поло',
    whatsappText: 'Здравствуйте! Хотим корпоративный мерч. Что нужно: , количество: ',
    ideasTitle: 'Из чего собираем',
    ideas: [
      { title: 'Одежда', text: 'Худи, свитшоты, футболки, поло. Вышивка, DTF, шелкография.', image: '/pictures/hudi.webp', alt: 'Худи с логотипом', to: '/katalog/hudi' },
      { title: 'Сумки и рюкзаки', text: 'Шоперы, рюкзаки и сумки с печатью или вышивкой.', image: '/pictures/sumka.webp', alt: 'Сумка с логотипом', to: '/katalog/shoppery' },
      { title: 'Посуда', text: 'Термосы, термокружки, бутылки, кружки.', image: '/pictures/portfolio/bosch.webp', alt: 'Посуда с логотипом Bosch', to: '/katalog/termokruzhki' },
      { title: 'Для мероприятий', text: 'Ланьярды, бейджи, блокноты, ручки. На складе больше 30 000 ланьярдов.', image: '/pictures/works/disney-pandora.webp', alt: 'Ланьярды Disney × Pandora', to: '/katalog/lanyardy-i-beydzhi' },
    ],
    offers: [],
    terms: { minQty: 'от 50 шт' },
    works: [WORKS.sds, WORKS.bosch, WORKS.russkiyDom],
    faq: FAQ_COMMON,
  },

  welcomePack: {
    path: '/welcome-pack',
    source: 'landing-welcome-pack',
    seo: {
      title: 'Welcome pack для новых сотрудников с логотипом',
      description: 'Welcome pack в стиле вашего бренда: худи, термос, блокнот, ручка, бейдж. Подбор под бюджет, нанесение логотипа, сборка наборов на складе в Алматы.',
    },
    eyebrow: 'Welcome pack',
    title: 'Welcome pack',
    titleAccent: 'для новых сотрудников',
    lead: 'Первый день в компании запоминается. Соберём набор в стиле вашего бренда: худи, термос, блокнот, ручка, бейдж. Подберём под бюджет, нанесём логотип и подготовим к выдаче.',
    heroImage: '/carousel/set-white.webp',
    heroAlt: 'Welcome pack: шопер, термос, блокнот и ручка с логотипом',
    whatsappText: 'Здравствуйте! Нужен welcome pack для новых сотрудников. Сколько наборов: , бюджет на набор: ',
    ideasTitle: 'Что положить в набор',
    ideas: [
      { title: 'Базовый набор', text: 'Шопер, термос, блокнот, ручка. Всё, что пригодится с первого дня.', image: '/carousel/set-white.webp', alt: 'Белый базовый набор' },
      { title: 'Одежда команды', text: 'Худи или футболка с логотипом. Самое заметное в наборе.', image: '/pictures/hudi.webp', alt: 'Худи с логотипом' },
      { title: 'Для рабочего стола', text: 'Блокнот, ручка, кружка или термокружка.', image: '/pictures/notebook-black.webp', alt: 'Чёрный блокнот с логотипом' },
      { title: 'Пропуск и бейдж', text: 'Ланьярд с логотипом и бейдж. На складе больше 10 000 бейджей.', image: '/pictures/works/disney-pandora.webp', alt: 'Ланьярды с логотипом', to: '/katalog/lanyardy-i-beydzhi' },
    ],
    offers: [],
    terms: { minQty: 'от 50 шт' },
    works: [WORKS.sds, WORKS.laska, WORKS.russkiyDom],
    faq: FAQ_COMMON,
  },
  clothing: {
    path: '/odezhda-s-logotipom',
    source: 'landing-odezhda-s-logotipom',
    seo: {
      title: 'Одежда с логотипом компании в Алматы: футболки, худи, поло',
      description: 'Корпоративная одежда с логотипом: футболки, поло, худи, свитшоты, кепки. Вышивка, DTF-печать, шелкография на своём производстве в Алматы.',
    },
    eyebrow: 'Одежда с логотипом',
    title: 'Одежда с логотипом,',
    titleAccent: 'которую носят',
    lead: 'Футболки, поло, худи, свитшоты и кепки для команды, мероприятий и промо. Вышивка, DTF-печать или шелкография на собственном производстве в Алматы.',
    heroImage: '/pictures/hudi.webp',
    heroAlt: 'Худи с логотипом',
    whatsappText: 'Здравствуйте! Нужна одежда с логотипом. Что именно: , количество и размеры: ',
    ideasTitle: 'Что делаем',
    ideas: [
      { title: 'Футболки и поло', text: 'Для команды, промоутеров и мероприятий.', image: '/pictures/portfolio/sds.webp', alt: 'Поло и мерч SDS', to: '/katalog/futbolki' },
      { title: 'Худи и свитшоты', text: 'Самая носимая часть мерча. Вышивка смотрится дороже всего.', image: '/pictures/hudi.webp', alt: 'Худи с логотипом', to: '/katalog/hudi' },
      { title: 'Кепки и шапки', text: 'Бейсболки, панамы, шапки. Вышивка или печать.', image: '/pictures/disclo/dtf-print.webp', alt: 'DTF-печать на текстиле', to: '/katalog/kepki' },
      { title: 'Шелкография', text: 'Для больших тиражей: яркий, стойкий отпечаток.', image: '/pictures/disclo/silkscreen.webp', alt: 'Шелкография на текстиле' },
    ],
    offers: [],
    terms: { minQty: 'от 50 шт' },
    works: [WORKS.sds, WORKS.bosch, WORKS.russkiyDom],
    faq: FAQ_COMMON,
  },

  souvenirs: {
    path: '/suvenirnaya-produkciya',
    source: 'landing-suvenirnaya-produkciya',
    seo: {
      title: 'Сувенирная продукция с логотипом в Алматы',
      description: 'Сувенирная и промо продукция с логотипом: ручки, термосы, блокноты, бутылки, ланьярды, наборы. Тысячи позиций на складе в Алматы, нанесение на своём производстве.',
    },
    eyebrow: 'Сувенирная продукция',
    title: 'Сувенирка с логотипом,',
    titleAccent: 'которую не выбрасывают',
    lead: 'Ручки, термосы, блокноты, бутылки, ланьярды и наборы. Тысячи позиций на складе в Алматы, нанесение на собственном производстве, отправка по всему Казахстану.',
    heroImage: '/carousel/set-blue.webp',
    heroAlt: 'Набор с логотипом: зонт, ежедневник, термос и ручка',
    whatsappText: 'Здравствуйте! Нужна сувенирная продукция с логотипом. Что именно: , количество: ',
    ideasTitle: 'Самое востребованное',
    ideas: [
      { title: 'Ручки', text: 'Больше 300 000 на складе. Пластик, металл, soft-touch.', image: '/pictures/pens-fan.webp', alt: 'Ручки с логотипом', to: '/katalog/ruchki' },
      { title: 'Термосы и термокружки', text: 'Печать или гравировка.', image: '/pictures/portfolio/bosch.webp', alt: 'Термокружка Bosch', to: '/katalog/termosy' },
      { title: 'Блокноты', text: 'Больше 22 000 на складе. Тиснение или печать.', image: '/pictures/notebooks.webp', alt: 'Блокноты с логотипом', to: '/katalog/bloknoty' },
      { title: 'Наборы', text: 'Собираем из нескольких вещей и упаковываем.', image: '/carousel/set-white.webp', alt: 'Набор с логотипом', to: '/katalog/podarochnye-nabory' },
    ],
    offers: [],
    terms: { minQty: 'от 50 шт' },
    works: [WORKS.bosch, WORKS.laska, WORKS.russkiyDom],
    faq: FAQ_COMMON,
  },

  printing: {
    path: '/nanesenie-logotipa',
    source: 'landing-nanesenie-logotipa',
    seo: {
      title: 'Нанесение логотипа в Алматы: УФ-печать, гравировка, DTF, шелкография',
      description: 'Нанесение логотипа на сувениры и одежду на своём производстве в Алматы: УФ-печать, лазерная гравировка, DTF, шелкография, тиснение. Больше 10 станков, УФ и DTF от 1 дня.',
    },
    eyebrow: 'Нанесение логотипа',
    title: 'Нанесение логотипа',
    titleAccent: 'на своём производстве',
    lead: 'Больше 10 печатных станков в Алматы. УФ-печать, DTF, лазерная гравировка, шелкография, тиснение, сублимация, термотрансфер. Пластик, металл, текстиль, бумага. УФ и DTF от 1 дня.',
    heroImage: '/pictures/disclo/laser-engraving.webp',
    heroAlt: 'Лазерная гравировка логотипа на металле',
    whatsappText: 'Здравствуйте! Нужно нанести логотип. На что: , количество: ',
    note: 'Стоимость нанесения можно примерно посчитать в калькуляторе на главной.',
    ideasTitle: 'Технологии',
    ideas: [
      { title: 'УФ-печать', text: 'Полноцветная печать на пластике, металле и бумаге. От 1 дня.', image: '/pictures/disclo/uv-print.webp', alt: 'УФ-печать логотипа' },
      { title: 'Лазерная гравировка', text: 'Вечный логотип на металле: ручки, термосы, флешки.', image: '/pictures/disclo/laser-engraving.webp', alt: 'Лазерная гравировка' },
      { title: 'DTF-печать', text: 'Яркая печать на текстиле любого цвета. От 1 дня.', image: '/pictures/disclo/dtf-print.webp', alt: 'DTF-печать' },
      { title: 'Шелкография и тиснение', text: 'Шелкография для тиражей на текстиле, тиснение фольгой и слепое на ежедневниках.', image: '/pictures/disclo/gold-foil.webp', alt: 'Тиснение фольгой' },
    ],
    offers: [],
    terms: { minQty: 'от 50 шт' },
    works: [WORKS.bosch, WORKS.sds, WORKS.laska],
    faq: FAQ_COMMON,
  },
} satisfies Record<string, Landing>

/** Все посадочные — для подвала и перелинковки. */
export const LANDING_LINKS = [
  { to: LANDINGS.newYear.path, label: 'Новогодние подарки' },
  { to: LANDINGS.corporateGifts.path, label: 'Корпоративные подарки' },
  { to: LANDINGS.merch.path, label: 'Мерч под ключ' },
  { to: LANDINGS.welcomePack.path, label: 'Welcome pack' },
  { to: LANDINGS.clothing.path, label: 'Одежда с логотипом' },
  { to: LANDINGS.souvenirs.path, label: 'Сувенирная продукция' },
  { to: LANDINGS.printing.path, label: 'Нанесение логотипа' },
]
