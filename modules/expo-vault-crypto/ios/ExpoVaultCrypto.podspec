Pod::Spec.new do |s|
  s.name           = 'ExpoVaultCrypto'
  s.version        = '0.1.0'
  s.summary        = 'Native crypto for Vault Family'
  s.description    = 'PBKDF2, AES-256-GCM, X25519 using platform native crypto (CommonCrypto + CryptoKit).'
  s.author         = ''
  s.homepage       = 'https://github.com/anthropics/claude-code'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.swift"
  s.frameworks = 'CryptoKit'
end
