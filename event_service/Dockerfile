# syntax=docker/dockerfile:1.7

# FROM node:20-alpine

# WORKDIR /app

# COPY package*.json ./
# # RUN npm install --production
# # NEW
# RUN npm install --omit=dev

# COPY prisma ./prisma/
# RUN npx prisma generate

# COPY . .
# COPY entrypoint.sh ./
# RUN chmod +x entrypoint.sh

# EXPOSE 3001

# CMD ["node", "index.js"]

FROM node:20-alpine

RUN apk add --no-cache aws-cli

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
COPY entrypoint.sh ./
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

RUN --mount=type=secret,id=aws_region,required=false \
    --mount=type=secret,id=ssm_state_machine_arn_param,required=false \
    --mount=type=secret,id=aws_access_key_id,required=false \
    --mount=type=secret,id=aws_secret_access_key,required=false \
    set -e; \
	if [ -f /run/secrets/aws_region ] && [ -f /run/secrets/ssm_state_machine_arn_param ] && [ -f /run/secrets/aws_access_key_id ] && [ -f /run/secrets/aws_secret_access_key ]; then \
		AWS_REGION="$(cat /run/secrets/aws_region)"; \
		SSM_STATE_MACHINE_ARN_PARAM="$(cat /run/secrets/ssm_state_machine_arn_param)"; \
		AWS_ACCESS_KEY_ID="$(cat /run/secrets/aws_access_key_id)"; \
		AWS_SECRET_ACCESS_KEY="$(cat /run/secrets/aws_secret_access_key)"; \
		export AWS_REGION AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY; \
		STATE_MACHINE_ARN="$(aws ssm get-parameter --name "${SSM_STATE_MACHINE_ARN_PARAM}" --with-decryption --query "Parameter.Value" --output text --region "${AWS_REGION}")"; \
	else \
		STATE_MACHINE_ARN="$(grep -E '^STATE_MACHINE_ARN=' /app/.env 2>/dev/null | tail -n 1 | cut -d '=' -f2- | tr -d '"' | tr -d '\r')"; \
	fi; \
	if [ -z "${STATE_MACHINE_ARN}" ]; then echo "Failed to resolve STATE_MACHINE_ARN from SSM secrets or /app/.env"; exit 1; fi; \
	printf 'export STATE_MACHINE_ARN=%s\n' "${STATE_MACHINE_ARN}" > /app/.runtime-env; \
	chmod 600 /app/.runtime-env; \
	rm -f /app/.env

EXPOSE 3001

CMD ["sh", "./entrypoint.sh"]