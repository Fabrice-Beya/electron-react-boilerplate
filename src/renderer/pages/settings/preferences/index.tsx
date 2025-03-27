import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useEnvStore, EnvVars } from '../../../store/envStore';

const PreferencesPage = () => {
  const navigate = useNavigate();
  const { envVars, setEnvVars, updateEnvVar } = useEnvStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    LLM_API_KEY_DEEPSEEK: false,
    LLM_API_KEY_OLLAMA: false,
  });

  // Listen for environment variable updates
  useEffect(() => {
    const unsubscribe = window.electron.ipcRenderer.on('env-vars-updated', (...args: unknown[]) => {
      const newEnvVars = args[0] as any;
      
      // Update AI vars
      setEnvVars({
        BACKEND_PROVIDER: newEnvVars.BACKEND_PROVIDER || '',
        LLM_API_URL_DEEPSEEK: newEnvVars.LLM_API_URL_DEEPSEEK || '',
        LLM_API_KEY_DEEPSEEK: newEnvVars.LLM_API_KEY_DEEPSEEK || '',
        LLM_API_URL_OLLAMA: newEnvVars.LLM_API_URL_OLLAMA || '',
        LLM_API_KEY_OLLAMA: newEnvVars.LLM_API_KEY_OLLAMA || '',
        DEFAULT_AI_PROVIDER: newEnvVars.DEFAULT_AI_PROVIDER || 'deepseek',
      });
    });

    return () => {
      unsubscribe();
    };
  }, [setEnvVars]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Update environment variables in the main process
      await window.electron.ipcRenderer.sendMessage('update-env-vars', envVars);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleEnvVarChange = (key: keyof EnvVars) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    updateEnvVar(key, event.target.value);
  };

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={() => navigate('/settings')}
          sx={{ mr: 2 }}
          aria-label="back"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Preferences
        </Typography>
      </Box>

      <Paper sx={{ p: 3, flex: 1, overflow: 'auto' }}>
        <Typography variant="h6" gutterBottom>
          AI Provider Settings
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Default AI Provider</InputLabel>
          <Select
            value={envVars.DEFAULT_AI_PROVIDER}
            label="Default AI Provider"
            onChange={(e) => updateEnvVar('DEFAULT_AI_PROVIDER', e.target.value as 'deepseek' | 'ollama')}
          >
            <MenuItem value="deepseek">DeepSeek</MenuItem>
            <MenuItem value="ollama">Ollama</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Backend Provider"
            value={envVars.BACKEND_PROVIDER}
            onChange={handleEnvVarChange('BACKEND_PROVIDER')}
            fullWidth
          />
          <TextField
            label="DeepSeek API URL"
            value={envVars.LLM_API_URL_DEEPSEEK}
            onChange={handleEnvVarChange('LLM_API_URL_DEEPSEEK')}
            fullWidth
          />
          <TextField
            label="DeepSeek API Key"
            value={envVars.LLM_API_KEY_DEEPSEEK}
            onChange={handleEnvVarChange('LLM_API_KEY_DEEPSEEK')}
            fullWidth
            type={showKeys.LLM_API_KEY_DEEPSEEK ? 'text' : 'password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => toggleKeyVisibility('LLM_API_KEY_DEEPSEEK')}
                    edge="end"
                  >
                    {showKeys.LLM_API_KEY_DEEPSEEK ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Ollama API URL"
            value={envVars.LLM_API_URL_OLLAMA}
            onChange={handleEnvVarChange('LLM_API_URL_OLLAMA')}
            fullWidth
          />
          <TextField
            label="Ollama API Key"
            value={envVars.LLM_API_KEY_OLLAMA}
            onChange={handleEnvVarChange('LLM_API_KEY_OLLAMA')}
            fullWidth
            type={showKeys.LLM_API_KEY_OLLAMA ? 'text' : 'password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => toggleKeyVisibility('LLM_API_KEY_OLLAMA')}
                    edge="end"
                  >
                    {showKeys.LLM_API_KEY_OLLAMA ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Preferences saved successfully
          </Alert>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default PreferencesPage; 