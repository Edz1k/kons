/**
 * Часть для админки Directus: шаг «Рассылка о новинке» в редакторе Flows.
 * Без сборки — объект в том виде, который ждёт defineOperationApp.
 */

export const operations = [
  {
    id: 'brillex-newsletter',
    name: 'Рассылка о новинке',
    icon: 'campaign',
    description: 'Письмо клиентам о новом товаре или новом цвете',
    overview: () => [
      { label: 'Кому', text: 'Все клиенты или тестовый адрес из формы' },
    ],
    options: [],
  },
]
