import { WHATSAPP_LINK } from '~/constants/contacts'

/** Ссылка в WhatsApp с готовым первым сообщением — менеджер сразу видит, откуда клиент. */
export function whatsappWith(text: string) {
  return `${WHATSAPP_LINK}?text=${encodeURIComponent(text)}`
}

export interface Photo {
  src: string
  alt: string
}

/*
 * Ниже — временные фото из того, что уже есть на сайте.
 * Когда придут финальные, меняем только пути здесь.
 */

/** Блок 1: сетка 3D Marquee. Лучше всего смотрятся горизонтальные 3:2 или 4:3. */
export const heroPhotos: Photo[] = [
  { src: '/carousel/1.webp', alt: 'Брендированная одежда' },
  { src: '/pictures/disclo/1.webp', alt: 'Производство мерча' },
  { src: '/carousel/7.webp', alt: 'Корпоративный мерч' },
  { src: '/pictures/chain.webp', alt: 'Аксессуары с логотипом' },
  { src: '/carousel/10.webp', alt: 'Худи и свитшоты с нанесением' },
  { src: '/pictures/disclo/3.webp', alt: 'Нанесение логотипа' },
  { src: '/pictures/crocs.webp', alt: 'Сланцы с логотипом' },
  { src: '/carousel/11.webp', alt: 'Коллекция мерча' },
  { src: '/pictures/sumka.webp', alt: 'Шопер с логотипом' },
  { src: '/pictures/disclo/4.webp', alt: 'Готовый тираж' },
]

/** Блок 3: «любимые картинки» с параллаксом. Сейчас сланец и сумка, заменить на ручки и блокноты. */
export const stockPhotos = {
  left: { src: '/pictures/crocs.webp', alt: '' },
  right: { src: '/pictures/sumka.webp', alt: '' },
}

/** Блок 4: горизонтальные фото коллекций, 3–4 штуки. */
export const collectionPhotos: Photo[] = [
  { src: '/carousel/1.webp', alt: 'Коллекция мерча в едином стиле' },
  { src: '/carousel/7.webp', alt: 'Текстиль и аксессуары бренда' },
  { src: '/carousel/10.webp', alt: 'Одежда с логотипом' },
  { src: '/carousel/11.webp', alt: 'Корпоративные подарки' },
]

/** Блок 6: метод нанесения + фото с этим методом. */
export const printMethods: (Photo & { title: string })[] = [
  { title: 'UV-печать', src: '/pictures/disclo/1.webp', alt: 'UV-печать' },
  { title: 'DTF', src: '/pictures/disclo/Group1.webp', alt: 'DTF-печать' },
  { title: 'UV DTF', src: '/pictures/disclo/3.webp', alt: 'UV DTF' },
  { title: 'Лазер', src: '/pictures/disclo/Group2.webp', alt: 'Лазерная гравировка' },
  { title: 'Шелкография', src: '/pictures/disclo/4.webp', alt: 'Шелкография' },
  { title: 'Тиснение', src: '/pictures/disclo/Group3.webp', alt: 'Тиснение' },
  { title: 'Сублимация', src: '/pictures/disclo/Group4.webp', alt: 'Сублимация' },
  { title: 'Термотрансфер', src: '/pictures/disclo/Group5.webp', alt: 'Термотрансфер' },
]

/** Блок 8: реальные готовые проекты. Формат — горизонтальный 3:2. */
export const casePhotos: Photo[] = [
  { src: '/carousel/7.webp', alt: 'Реализованный проект' },
  { src: '/pictures/chain.webp', alt: 'Реализованный проект' },
  { src: '/carousel/10.webp', alt: 'Реализованный проект' },
  { src: '/pictures/disclo/3.webp', alt: 'Реализованный проект' },
  { src: '/carousel/11.webp', alt: 'Реализованный проект' },
  { src: '/pictures/sumka.webp', alt: 'Реализованный проект' },
]
