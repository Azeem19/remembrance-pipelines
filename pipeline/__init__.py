"""
Remembrance Pipelines — oral history transcription and archival infrastructure.

Every pipeline module checks consent before processing. Import order matters:
always call consent_check.validate() before any other pipeline step.
"""
