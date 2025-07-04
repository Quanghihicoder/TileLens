# ========== Share Resources ==========
resource "aws_s3_bucket" "codepipeline_bucket" {
  bucket        = "tilelens-codepipeline-artifacts"
  force_destroy = true
}

resource "aws_codestarconnections_connection" "github_connection" {
  name          = "github-connection"
  provider_type = "GitHub"
}

data "aws_secretsmanager_secret" "github_token" {
  name = "AWSGitHub"
}

data "aws_secretsmanager_secret_version" "github_token" {
  secret_id = data.aws_secretsmanager_secret.github_token.id
}


# ========== IAM Roles ==========
resource "aws_iam_role" "codebuild_role" {
  name = "tilelens-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "codebuild_policy" {
  name = "tilelens-codebuild-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "s3:*",
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction",
          "codecommit:GitPull",
          "ecr:*",
          "ecs:*",
          "lambda:*",
          "iam:PassRole"
        ],
        Resource = ["*"]
      },
      {
        Effect = "Allow",
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:DeleteObject"
        ],
        Resource = [
          var.frontend_bucket_arn,
          "${var.frontend_bucket_arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "codebuild_attach_policy" {
  role       = aws_iam_role.codebuild_role.name
  policy_arn = aws_iam_policy.codebuild_policy.arn
}

resource "aws_iam_role" "codedeploy_role" {
  name = "tilelens-codedeploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "codedeploy.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role" "codepipeline_role" {
  name = "tilelens-codepipeline-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "codepipeline_policy" {
  name = "tilelens-codepipeline_policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:*",
          "codebuild:*",
          "codestar-connections:UseConnection",
          "lambda:*",
          "ecs:*",
          "iam:PassRole",
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "codepipeline_attach_policy" {
  role       = aws_iam_role.codepipeline_role.name
  policy_arn = aws_iam_policy.codepipeline_policy.arn
}

# ========== CodeBuild ==========
resource "aws_codebuild_project" "tiling_lambda_build" {
  name          = "tiling-lambda-build-project"
  description   = "Build project for Tiling Lambda function"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = "5"

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_SMALL"
    image           = "aws/codebuild/standard:5.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

    environment_variable {
      name  = "FUNCTION_NAME"
      value = "tiling"
    }
  }

  source {
    type            = "GITHUB"
    location        = var.github_url
    git_clone_depth = 1
    buildspec       = "/devops/modules/pipeline/spec/lambdabuild.yml"
    auth {
      type     = "OAUTH"
      resource = data.aws_secretsmanager_secret_version.github_token.secret_string
    }
  }

  source_version = "production"
}

resource "aws_codebuild_project" "clipping_lambda_build" {
  name          = "clipping-lambda-build-project"
  description   = "Build project for Clipping Lambda function"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = "5"

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_SMALL"
    image           = "aws/codebuild/standard:5.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

    environment_variable {
      name  = "FUNCTION_NAME"
      value = "clipping"
    }
  }

  source {
    type            = "GITHUB"
    location        = var.github_url
    git_clone_depth = 1
    buildspec       = "/devops/modules/pipeline/spec/lambdabuild.yml"
    auth {
      type     = "OAUTH"
      resource = data.aws_secretsmanager_secret_version.github_token.secret_string
    }
  }

  source_version = "production"
}

resource "aws_codebuild_project" "blending_lambda_build" {
  name          = "blending-lambda-build-project"
  description   = "Build project for Blending Lambda function"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = "5"

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_SMALL"
    image           = "aws/codebuild/standard:5.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

    environment_variable {
      name  = "FUNCTION_NAME"
      value = "blending"
    }
  }

  source {
    type            = "GITHUB"
    location        = var.github_url
    git_clone_depth = 1
    buildspec       = "/devops/modules/pipeline/spec/lambdabuild.yml"
    auth {
      type     = "OAUTH"
      resource = data.aws_secretsmanager_secret_version.github_token.secret_string
    }
  }

  source_version = "production"
}

resource "aws_codebuild_project" "ecs_build" {
  name          = "ecs-build-project"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = "10"

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_SMALL"
    image           = "aws/codebuild/standard:5.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "ECR_REGISTRY"
      value = "058264550947.dkr.ecr.${var.aws_region}.amazonaws.com"
    }

    environment_variable {
      name  = "IMAGE_REPO_NAME"
      value = "tilelens"
    }

    environment_variable {
      name  = "CONTAINER_NAME"
      value = "tilelens"
    }
  }

  source {
    type            = "GITHUB"
    location        = var.github_url
    git_clone_depth = 1
    buildspec       = "/devops/modules/pipeline/spec/ecsbuild.yml"

    auth {
      type     = "OAUTH"
      resource = data.aws_secretsmanager_secret_version.github_token.secret_string
    }
  }

  source_version = "production"
}

resource "aws_codebuild_project" "frontend_build" {
  name          = "frontend-build-project"
  service_role  = aws_iam_role.codebuild_role.arn
  build_timeout = "5"

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type    = "BUILD_GENERAL1_SMALL"
    image           = "aws/codebuild/standard:5.0"
    type            = "LINUX_CONTAINER"
    privileged_mode = true
  }

  source {
    type            = "GITHUB"
    location        = var.github_url
    git_clone_depth = 1
    buildspec       = "/devops/modules/pipeline/spec/frontendbuild.yml"

    auth {
      type     = "OAUTH"
      resource = data.aws_secretsmanager_secret_version.github_token.secret_string
    }
  }

  source_version = "production"
}

# Pipeline
resource "aws_codepipeline" "tilelens_pipeline" {
  name     = "tilelens-pipeline"
  role_arn = aws_iam_role.codepipeline_role.arn

  artifact_store {
    location = aws_s3_bucket.codepipeline_bucket.bucket
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        ConnectionArn    = aws_codestarconnections_connection.github_connection.arn
        FullRepositoryId = var.github_fullrepository
        BranchName       = "production"
      }
    }
  }

  stage {
    name = "Build Tiling Lambda"

    action {
      name             = "BuildTiling"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["tiling_build_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.tiling_lambda_build.name
      }
    }
  }

  stage {
    name = "Build Clipping Lambda"

    action {
      name             = "BuildClipping"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["clipping_build_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.clipping_lambda_build.name
      }
    }
  }

  stage {
    name = "Build Blending Lambda"

    action {
      name             = "BuildBlending"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["blending_build_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.blending_lambda_build.name
      }
    }
  }

  stage {
    name = "Build Backend"

    action {
      name             = "BuildBackend"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["backend_build_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.ecs_build.name
      }
    }
  }

  stage {
    name = "Build Frontend"

    action {
      name             = "BuildFrontend"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      input_artifacts  = ["source_output"]
      output_artifacts = ["frontend_build_output"]
      version          = "1"

      configuration = {
        ProjectName = aws_codebuild_project.frontend_build.name
      }
    }
  }

  stage {
    name = "Deploy Tiling Lambda"

    action {
      name            = "DeployTiling"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "Lambda"
      version         = "1"
      input_artifacts = ["tiling_build_output"]

      configuration = {
        FunctionName = var.tiling_lambda_name
      }
    }
  }

  stage {
    name = "Deploy Clipping Lambda"

    action {
      name            = "DeployClipping"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "Lambda"
      version         = "1"
      input_artifacts = ["clipping_build_output"]

      configuration = {
        FunctionName = var.clipping_lambda_name
      }
    }
  }

  stage {
    name = "Deploy Blending Lambda"

    action {
      name            = "DeployBlending"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "Lambda"
      version         = "1"
      input_artifacts = ["blending_build_output"]

      configuration = {
        FunctionName = var.blending_lambda_name
      }
    }
  }

  stage {
    name = "Deploy Backend"

    action {
      name            = "DeployBackend"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "ECS"
      version         = "1"
      input_artifacts = ["backend_build_output"]

      configuration = {
        ClusterName = var.ecs_cluster_name
        ServiceName = var.ecs_service_name
        FileName    = "imagedefinitions.json"
      }
    }
  }

  stage {
    name = "Deploy Frontend"

    action {
      name            = "DeployFrontend"
      category        = "Deploy"
      owner           = "AWS"
      provider        = "S3"
      version         = "1"
      input_artifacts = ["frontend_build_output"]

      configuration = {
        BucketName = var.frontend_bucket_name
        Extract    = "true"
      }
    }
  }
}
