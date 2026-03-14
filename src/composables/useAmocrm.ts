export function useAmocrm() {
  async function sendForm(data: Record<string, string>) {
    const formData = new FormData()

    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value)
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
