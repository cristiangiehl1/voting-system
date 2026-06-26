const API_KEY = process.env.EMAIL_SERVICE_API_KEY || "POWER_RANGER_LEPROSO"
const EMAIL_URL = process.env.EMAIL_SERVICE_BASE_URL || "http://localhost:3001/api/emails/send"

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch(EMAIL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ to, subject, html }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Erro ao enviar email: ${err}`)
  }

  return res.json()
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const link = `${origin}/api/auth/verify?token=${token}`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;min-height:100vh">
    <tr>
      <td align="center" style="padding:48px 16px">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
          <tr>
            <td style="padding-bottom:32px;text-align:center">
              <span style="font-size:22px;font-weight:700;color:#1a1a2e">Eleito</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:48px;height:48px;border-radius:12px;background-color:#2563eb;text-align:center;vertical-align:middle">
                          <span style="font-size:22px;font-weight:700;color:#ffffff;line-height:48px">E</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:8px">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#1a1a2e;letter-spacing:-0.3px">Confirme seu email</h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:20px">
                    <p style="margin:0;font-size:15px;color:#64748b;line-height:1.5">Ol\u00e1 <strong style="color:#1a1a2e">${name}</strong>,</p>
                    <p style="margin:8px 0 0;font-size:15px;color:#64748b;line-height:1.5">Voc\u00ea criou uma conta no <strong>Eleito</strong>. Clique no bot\u00e3o abaixo para confirmar seu email e come\u00e7ar a usar a plataforma.</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:8px 0 24px">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:8px;background-color:#2563eb;padding:0">
                          <a href="${link}" style="display:inline-block;padding:13px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background-color:#2563eb">Confirmar email</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:0;font-size:13px;color:#94a3b8">Se voc\u00ea n\u00e3o criou esta conta, ignore este email.</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#94a3b8">O link expira em 24 horas.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px">
              <p style="margin:0;font-size:12px;color:#94a3b8">&copy; ${new Date().getFullYear()} Eleito. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return sendEmail(to, "Confirme seu email - Eleito", html)
}

export async function sendResetPasswordEmail(to: string, name: string, token: string) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const link = `${origin}/reset-password?token=${token}`

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;min-height:100vh">
    <tr>
      <td align="center" style="padding:48px 16px">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
          <tr>
            <td style="padding-bottom:32px;text-align:center">
              <span style="font-size:22px;font-weight:700;color:#1a1a2e">Eleito</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:48px;height:48px;border-radius:12px;background-color:#2563eb;text-align:center;vertical-align:middle">
                          <span style="font-size:22px;font-weight:700;color:#ffffff;line-height:48px">E</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:8px">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#1a1a2e;letter-spacing:-0.3px">Redefinir senha</h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:20px">
                    <p style="margin:0;font-size:15px;color:#64748b;line-height:1.5">Ol\u00e1 <strong style="color:#1a1a2e">${name}</strong>,</p>
                    <p style="margin:8px 0 0;font-size:15px;color:#64748b;line-height:1.5">Recebemos uma solicita\u00e7\u00e3o para redefinir sua senha no <strong>Eleito</strong>. Clique no bot\u00e3o abaixo para criar uma nova senha.</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:8px 0 24px">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:8px;background-color:#2563eb;padding:0">
                          <a href="${link}" style="display:inline-block;padding:13px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background-color:#2563eb">Redefinir senha</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin:0;font-size:13px;color:#94a3b8">Se voc\u00ea n\u00e3o solicitou esta redefini\u00e7\u00e3o, ignore este email.</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#94a3b8">O link expira em 1 hora.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:24px">
              <p style="margin:0;font-size:12px;color:#94a3b8">&copy; ${new Date().getFullYear()} Eleito. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return sendEmail(to, "Redefina sua senha - Eleito", html)
}
