export async function log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'debug'): Promise<void> {
  try {
    const response = await fetch('/api/logtail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, level }),
    });
    if (!response.ok) {
      console.error('Failed to log message to server');
    }
  } catch (error) {
    console.error('Error logging message to server:', error);
  }
}