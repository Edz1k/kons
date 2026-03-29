export interface AmoFormPayload {
  name: string
  phone: string
  source: string
  product_title?: string
  variant_name?: string
  sku?: string
  quantity?: string
}

export function useAmocrm() {
  async function sendForm(data: AmoFormPayload) {
    const formData = new FormData()

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '')
        formData.append(key, String(value))
    })

    await fetch(
      'https://wdg.biz-crm.ru/inserv/in.php?token=ddcb6925f647cd7e65a12af2bec0dea1',
      {
        method: 'POST',
        body: formData,
        mode: 'no-cors',
      },
    )
  }

  return {
    sendForm,
  }
}
