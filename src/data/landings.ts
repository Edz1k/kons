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
      { title: 'Наборы для команды', text: 'Шопер, блокнот, бутылка и ручка в одном стиле. Собираем и упаковываем на нашем складе.', image: '/carousel/set-black.webp', alt: 'Чёрный набор: шопер, блокнот, бутылка' },
      { title: 'Клиентам и партнёрам', text: 'Термос, ежедневник, зонт. Вещи, которыми пользуются весь год, а не убирают в ящик после праздников.', image: '/carousel/set-blue.webp', alt: 'Синий набор: зонт, ежедневник, термос' },
      { title: 'Тёплый текстиль', text: 'Худи и свитшоты с вышивкой или печатью. Носят и зимой, и после.', image: '/pictures/hudi.webp', alt: 'Худи с логотипом' },
      { title: 'Ежедневники и блокноты', text: 'Тиснение, гравировка или печать. На складе больше 22 000 блокнотов.', image: '/pictures/notebooks.webp', alt: 'Ежедневники с логотипом' },
    ],
    // TODO: 2–3 реальных набора с составом и ценой «от» — блок появится сам
    offers: [],
    // TODO: минимальный тираж и крайний срок заказа к Новому году
    terms: {},
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
      { title: 'Готовые наборы', text: 'Несколько вещей в одном стиле: шопер, термос, блокнот, ручка. Комплектуем и упаковываем сами.', image: '/carousel/set-white.webp', alt: 'Белый набор с логотипом' },
      { title: 'Термосы и кружки', text: 'Печать или гравировка логотипа. Подарок, который каждый день стоит на столе.', image: '/pictures/portfolio/bosch.webp', alt: 'Термокружка и кружка Bosch' },
      { title: 'Ежедневники', text: 'Тиснение фольгой, слепое тиснение, гравировка, печать.', image: '/pictures/notebooks.webp', alt: 'Ежедневники с логотипом' },
      { title: 'Ручки', text: 'Больше 300 000 ручек на складе. Пластик, металл, soft-touch.', image: '/pictures/pens-fan.webp', alt: 'Ручки с логотипом' },
    ],
    offers: [],
    terms: {},
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
      { title: 'Одежда', text: 'Худи, свитшоты, футболки, поло. Вышивка, DTF, шелкография.', image: '/pictures/hudi.webp', alt: 'Худи с логотипом' },
      { title: 'Сумки и рюкзаки', text: 'Шоперы, рюкзаки и сумки с печатью или вышивкой.', image: '/pictures/sumka.webp', alt: 'Сумка с логотипом' },
      { title: 'Посуда', text: 'Термосы, термокружки, бутылки, кружки.', image: '/pictures/portfolio/bosch.webp', alt: 'Посуда с логотипом Bosch' },
      { title: 'Для мероприятий', text: 'Ланьярды, бейджи, блокноты, ручки. На складе больше 30 000 ланьярдов.', image: '/pictures/works/disney-pandora.webp', alt: 'Ланьярды Disney × Pandora' },
    ],
    offers: [],
    terms: {},
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
      { title: 'Пропуск и бейдж', text: 'Ланьярд с логотипом и бейдж. На складе больше 10 000 бейджей.', image: '/pictures/works/disney-pandora.webp', alt: 'Ланьярды с логотипом' },
    ],
    offers: [],
    terms: {},
    works: [WORKS.sds, WORKS.laska, WORKS.russkiyDom],
    faq: FAQ_COMMON,
  },
} satisfies Record<string, Landing>

/** Все посадочные — для подвала и перелинковки. */
export const LANDING_LINKS = [
  { to: LANDINGS.newYear.path, label: 'Новогодние подарки' },
  { to: LANDINGS.corporateGifts.path, label: 'Корпоративные подарки' },
  { to: LANDINGS.merch.path, label: 'Мерч под ключ' },
  { to: LANDINGS.welcomePack.path, label: 'Welcome pack' },
]
