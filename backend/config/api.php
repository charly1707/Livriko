<?php
// backend/config/api.php
// Configure your AI API key here or set the environment variable OPENAI_API_KEY
// Do NOT commit real API keys to version control.

$OPENAI_API_KEY = getenv('OPENAI_API_KEY') ?: '';

return ['OPENAI_API_KEY' => $OPENAI_API_KEY];
