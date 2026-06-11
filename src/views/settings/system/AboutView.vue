<template>
  <section class="settings-view">
    <h1 class="settings-title">关于</h1>
    <div class="settings-card about-card">
      <div class="about-logo">
        <div class="logo-mark">H</div>
        <div>
          <h2>Honghu AI Chat</h2>
          <p>版本 1.0.0</p>
        </div>
      </div>
      <p class="copyright">© 2026 Honghu AI. All rights reserved.</p>
    </div>
  </section>
</template>

<style scoped>
.about-card {
  padding: 22px;
}

.about-logo {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--primary-color);
  color: #fff;
  font-size: 22px;
  font-weight: 900;
}

.about-logo h2 {
  margin: 0;
  color: var(--text-primary);
}

.about-logo p,
.copyright {
  color: var(--text-sub);
}

.copyright {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid var(--border-color);
  text-align: center;
  font-size: 12px;
}
</style>
