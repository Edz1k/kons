<template>
  <main>
    <div class="min-h-screen flex flex-col">
      <NavbarComponent />

      <main class="flex-1">
        <router-view />
      </main>
      <ContactForm />
      <FooterComponent />
    </div>
  </main>
</template>
