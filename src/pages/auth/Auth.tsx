import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';

const Login = React.lazy(() => import('./Login'));
const OAuthCallback = React.lazy(() => import('./OAuthCallback'));

export default function Auth() {
  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      {/* ── Left branding panel ── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '45%',
          minWidth: 420,
          background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 40%, #0f172a 100%)',
          position: 'relative',
          overflow: 'hidden',
          p: 5,
        }}
      >
        {/* Ambient glow — top-right */}
        <Box
          sx={{
            position: 'absolute',
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />
        {/* Ambient glow — bottom-left */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -150,
            left: -150,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(148,163,184,0.06) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />
        {/* Fine grid overlay for texture */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          }}
        />

        {/* Top — logo */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              sx={{
                color: '#fff',
                fontSize: '1.125rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              CH
            </Typography>
          </Box>
        </Box>

        {/* Center — headline + features */}
        <Box sx={{ position: 'relative', zIndex: 1, my: 'auto', py: 6 }}>
          <Typography
            sx={{
              color: '#fff',
              fontSize: '2.5rem',
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              mb: 2,
            }}
          >
            Legal case
            <br />
            management,
            <br />
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(90deg, #94a3b8, #e2e8f0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              refined.
            </Box>
          </Typography>
          <Typography
            sx={{
              color: 'rgba(148,163,184,0.8)',
              fontSize: '1.0625rem',
              fontWeight: 400,
              lineHeight: 1.6,
              maxWidth: 340,
              mt: 3,
            }}
          >
            Organize evidence, build arguments, and manage exhibits in one focused workspace.
          </Typography>

          {/* Feature pills */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 4 }}>
            {['AI-powered analysis', 'Document management', 'Evidence tracking'].map(
              (label) => (
                <Box
                  key={label}
                  sx={{
                    px: 1.75,
                    py: 0.625,
                    borderRadius: '100px',
                    border: '1px solid rgba(148,163,184,0.15)',
                    backgroundColor: 'rgba(148,163,184,0.05)',
                    color: 'rgba(203,213,225,0.75)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    letterSpacing: '0.015em',
                  }}
                >
                  {label}
                </Box>
              )
            )}
          </Box>
        </Box>

        {/* Bottom — copyright */}
        <Typography
          sx={{
            position: 'relative',
            zIndex: 1,
            color: 'rgba(100,116,139,0.5)',
            fontSize: '0.6875rem',
            letterSpacing: '0.03em',
          }}
        >
          Clarity Hub
        </Typography>
      </Box>

      {/* ── Right login panel ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          position: 'relative',
          px: 3,
        }}
      >
        {/* Subtle corner accent */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 320,
            height: 320,
            background: 'radial-gradient(circle at 100% 0%, rgba(241,245,249,0.8) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: 240,
            height: 240,
            background: 'radial-gradient(circle at 0% 100%, rgba(241,245,249,0.6) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <Box
          sx={{
            width: '100%',
            maxWidth: 380,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <React.Suspense
            fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    border: '3px solid #e2e8f0',
                    borderTopColor: '#1e293b',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    '@keyframes spin': {
                      to: { transform: 'rotate(360deg)' },
                    },
                  }}
                />
              </Box>
            }
          >
            <Routes>
              <Route path="login" element={<Login />} />
              <Route path="callback" element={<OAuthCallback />} />
              <Route path="*" element={<Navigate to="login" replace />} />
            </Routes>
          </React.Suspense>
        </Box>
      </Box>
    </Box>
  );
}
