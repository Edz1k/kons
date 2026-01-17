<template>
  <main>
    <div class="min-h-screen flex flex-col">
      <NavbarComponent />

      <main class="my-10 flex-1">
        <router-view />
      </main>

      <footer class="border-t p-4 opacity-70">
        Footer
      </footer>
    </div>
  </main>
</template>
