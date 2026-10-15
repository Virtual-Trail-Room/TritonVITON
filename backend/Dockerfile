# Use NVIDIA base image with CUDA 12.4.1 and Ubuntu 22.04
FROM nvidia/cuda:12.4.1-devel-ubuntu22.04

# Set non-interactive frontend
ENV DEBIAN_FRONTEND=noninteractive

# Update and install basic packages
RUN apt-get update && apt-get install -y \
    liblzma-dev \
    xz-utils \
    wget \
    nano\
    curl \
    git \
    ca-certificates \
    libglib2.0-0 \
    libxext6 \
    libsm6 \
    libxrender1 \
    build-essential \
    gcc-10 g++-10 \
    zlib1g-dev \
    libbz2-dev \
    libssl-dev \
    libreadline-dev \
    libsqlite3-dev \
    libffi-dev \
    libncursesw5-dev \
    xz-utils \
    tk-dev \
    && rm -rf /var/lib/apt/lists/*

# Set GCC/G++ version to 10
RUN update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-10 100 \
 && update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-10 100

# Install Python 3.8.0 from source
WORKDIR /opt
RUN wget https://www.python.org/ftp/python/3.8.0/Python-3.8.0.tgz && \
    tar xzf Python-3.8.0.tgz && \
    cd Python-3.8.0 && \
    ./configure --enable-optimizations && \
    make -j$(nproc) && \
    make altinstall && \
    ln -s /usr/local/bin/python3.8 /usr/bin/python3 && \
    ln -s /usr/local/bin/pip3.8 /usr/bin/pip3 && \
    cd .. && rm -rf Python-3.8.0 Python-3.8.0.tgz


# Ensure pip is installed for Python 3.8
RUN python3.8 -m ensurepip --upgrade

# Copy requirements.txt
COPY requirements.txt /tmp/requirements.txt

# Install pip packages with python3.8 -m pip
RUN python3.8 -m pip install --upgrade pip==20.3.3 setuptools==65.5.0 wheel==0.36.2 && \
    python3.8 -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124 && \
    python3.8 -m pip install opencv-python==4.11.0.86 matplotlib==3.7.5 tdqm==0.0.1 PyYAML==6.0.2 pillow==10.4.0 pandas==2.0.3 urllib3==2.2.3 ultralytics==8.3.133 ninja

RUN ln -s /usr/local/bin/python3.8 /usr/local/bin/python

# Copy project files into container
COPY . /workspace

# Set working directory
WORKDIR /workspace



