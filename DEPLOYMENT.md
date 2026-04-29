# synthsentry

Monorepo for the SynthSentry web app, deployed to Google Cloud Run through Google Cloud Deploy.

This repository is now configured for:

- container build for apps/web
- dev and prod Cloud Run services
- Cloud Deploy delivery pipeline
- Cloud Build CI pipeline that creates a Cloud Deploy release per commit

## Project values

- Project name: synthsentry
- Project ID: synthsentry
- Project number: 1078562117787
- Region: us-central1

## Files used for deployment

- clouddeploy.yaml: Cloud Deploy pipeline and targets
- skaffold.yaml: render profiles and image placeholder mapping
- run-service-dev.yaml: dev Cloud Run service manifest
- run-service-prod.yaml: prod Cloud Run service manifest
- cloudbuild.yaml: CI pipeline for build, push, and release creation
- apps/web/Dockerfile: production image build for Next.js app

## One-time setup in GCP

Run from repository root.

```bash
gcloud config set project synthsentry

gcloud services enable \
	run.googleapis.com \
	clouddeploy.googleapis.com \
	cloudbuild.googleapis.com \
	artifactregistry.googleapis.com

gcloud artifacts repositories create synthsentry \
	--repository-format=docker \
	--location=us-central1 \
	--description="SynthSentry container images"
```

If the Artifact Registry repository already exists, the create command will fail safely; continue.

## IAM required for CI/CD

Grant Cloud Build permission to push images and create releases.

```bash
PROJECT_ID=synthsentry
PROJECT_NUMBER=1078562117787

gcloud projects add-iam-policy-binding $PROJECT_ID \
	--member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
	--role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
	--member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
	--role="roles/clouddeploy.releaser"
```

Grant Cloud Deploy service agent permission to deploy to Cloud Run.

```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
	--member="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-clouddeploy.iam.gserviceaccount.com" \
	--role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
	--member="serviceAccount:service-${PROJECT_NUMBER}@gcp-sa-clouddeploy.iam.gserviceaccount.com" \
	--role="roles/iam.serviceAccountUser"
```

## Create delivery pipeline and targets

```bash
gcloud deploy apply \
	--file=clouddeploy.yaml \
	--region=us-central1 \
	--project=synthsentry
```

## Test a manual release once

This validates the whole flow before wiring automatic triggers.

```bash
gcloud builds submit \
	--config=cloudbuild.yaml \
	--project=synthsentry
```

After build success:

- a release is created in Cloud Deploy
- rollout to target synthsentry-dev starts

Promote to production when ready:

```bash
gcloud deploy releases promote \
	--delivery-pipeline=synthsentry-pipeline \
	--region=us-central1 \
	--project=synthsentry \
	--to-target=synthsentry-prod \
	--release=<release-name>
```

## Wire CI/CD trigger (recommended)

Create a Cloud Build trigger connected to your Git repository:

- Trigger type: push to branch
- Branch: main
- Config file: cloudbuild.yaml
- Region: global or us-central1 (matching your org policy)

Equivalent CLI example:

```bash
gcloud beta builds triggers create github \
	--name="synthsentry-main" \
	--repo-name="synthSentry" \
	--repo-owner="<github-owner>" \
	--branch-pattern="^main$" \
	--build-config="cloudbuild.yaml" \
	--project="synthsentry"
```

On every push to main:

1. image is built from apps/web/Dockerfile
2. image is pushed to Artifact Registry
3. Cloud Deploy release is created
4. dev rollout starts automatically
5. prod promotion is controlled by you

## Useful verification commands

```bash
gcloud deploy delivery-pipelines list --region=us-central1 --project=synthsentry
gcloud deploy targets list --region=us-central1 --project=synthsentry
gcloud deploy releases list --delivery-pipeline=synthsentry-pipeline --region=us-central1 --project=synthsentry
gcloud run services list --region=us-central1 --project=synthsentry
```
