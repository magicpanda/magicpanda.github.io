// 当文档加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化AOS动画库
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true
    });
  
    // 初始化地图
    initMap();
    
    // 设置导航栏滚动效果
    setupNavbarScroll();
    
    // 设置返回顶部按钮
    setupScrollToTop();
    
    // 设置活动选择器
    setupActivitySelector();
    
    // 设置电影选择器
    setupMovieSelector();
    
    // 设置运动会按钮
    setupGamesButton();
    
    // 设置画布
    setupSandcastleCanvas();
    
    // 设置更多照片按钮
    setupMorePhotosButton();
    
    // 设置复选框本地存储
    setupChecklistStorage();
  });
  
  // 初始化地图
  function initMap() {
    // 检查地图容器是否存在
    const mapElement = document.getElementById('travel-map');
    if (!mapElement) return;
    
    // 创建地图
    const map = L.map('travel-map').setView([39.8272, 119.4860], 13); // 北戴河的坐标
    
    // 添加地图图层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // 添加标记点
    const locations = [
      {
        name: '漫花居别墅',
        coords: [39.8262, 119.4940],
        icon: 'home',
        popup: '我们的住宿地点'
      },
      {
        name: '老虎石公园',
        coords: [39.8290, 119.5120],
        icon: 'sun',
        popup: '欣赏夕阳的好地方'
      },
      {
        name: '鸽子窝公园',
        coords: [39.8330, 119.5210],
        icon: 'water',
        popup: '赶海活动地点'
      },
      {
        name: '北戴河鸟类保护区',
        coords: [39.8390, 119.5070],
        icon: 'detail',
        popup: '观察春季候鸟'
      },
      {
        name: '金沙湾',
        coords: [39.8350, 119.4940],
        icon: 'beach',
        popup: '沙滩嘉年华活动地点'
      }
    ];
    
    // 创建自定义图标
    function createIcon(iconName) {
      return L.divIcon({
        html: `<i class="bx bx-${iconName}" style="font-size: 1.5rem; color: #0077b6;"></i>`,
        className: 'map-custom-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
    }
    
    // 添加所有标记点和弹窗
    locations.forEach(location => {
      const marker = L.marker(location.coords, {
        icon: createIcon(location.icon)
      }).addTo(map);
      
      marker.bindPopup(`<b>${location.name}</b><br>${location.popup}`);
    });
    
    // 添加路线（从北京到北戴河的大致路线）
    const routePoints = [
      [39.9042, 116.4074], // 北京
      [39.9142, 117.2074], // 途经点
      [39.8642, 118.3074], // 途经点
      [39.8272, 119.4860]  // 北戴河
    ];
    
    const route = L.polyline(routePoints, {
      color: '#0077b6',
      weight: 4,
      opacity: 0.7,
      dashArray: '10, 10'
    }).addTo(map);
    
    // 设置地图视图以显示整个路线
    map.fitBounds(route.getBounds(), { padding: [30, 30] });
  }
  
  // 设置导航栏滚动效果
  function setupNavbarScroll() {
    const mainNav = document.getElementById('mainNav');
    if (!mainNav) return;
    
    window.addEventListener('scroll', function() {
      if (window.scrollY > 100) {
        mainNav.classList.add('navbar-scrolled');
      } else {
        mainNav.classList.remove('navbar-scrolled');
      }
    });
  }
  
  // 设置返回顶部按钮
  function setupScrollToTop() {
    const scrollToTopButton = document.querySelector('.scroll-to-top');
    if (!scrollToTopButton) return;
    
    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        scrollToTopButton.classList.add('active');
      } else {
        scrollToTopButton.classList.remove('active');
      }
    });
    
    scrollToTopButton.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  // 切换寻宝游戏答案的显示与隐藏
  function toggleHints() {
    const hintsElement = document.getElementById('treasure-hints');
    if (!hintsElement) return;
    
    hintsElement.classList.toggle('d-none');
    
    const button = document.querySelector('[onclick="toggleHints()"]');
    if (button) {
      button.textContent = hintsElement.classList.contains('d-none') ? '显示答案' : '隐藏答案';
    }
  }
  
  // 设置活动选择器
  function setupActivitySelector() {
    const activityRadios = document.querySelectorAll('.activity-radio');
    if (activityRadios.length === 0) return;
    
    activityRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        // 隐藏所有活动详情
        document.querySelectorAll('.activity-content').forEach(content => {
          content.classList.add('d-none');
        });
        
        // 显示选中的活动详情
        const selectedActivity = this.value;
        const detailsElement = document.getElementById(`${selectedActivity}-details`);
        if (detailsElement) {
          detailsElement.classList.remove('d-none');
        }
      });
    });
  }
  
  // 设置电影选择器
  function setupMovieSelector() {
    const movieSelect = document.getElementById('movie-select');
    const moviePoster = document.getElementById('movie-poster');
    if (!movieSelect || !moviePoster) return;
    
    const moviePosters = {
      'finding-nemo': 'https://m.media-amazon.com/images/M/MV5BNTg4NjM2MDA4OF5BMl5BanBnXkFtZTcwMTQ2OTM4NQ@@._V1_.jpg',
      'totoro': 'https://m.media-amazon.com/images/M/MV5BYzJjMTYyMjQtZDI0My00ZjE2LTkyNGYtOTllNGQxNDMyZjE0XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg',
      'up': 'https://m.media-amazon.com/images/M/MV5BMTk3NDE2NzI4NF5BMl5BanBnXkFtZTgwNzE1MzEyMTE@._V1_.jpg',
      'coco': 'https://m.media-amazon.com/images/M/MV5BYjQ5NjM0Y2YtNjZkNC00ZDhkLWJjMWItN2QyNzFkMDE3ZjAxXkEyXkFqcGdeQXVyODIxMzk5NjA@._V1_.jpg'
    };
    
    movieSelect.addEventListener('change', function() {
      const selectedMovie = this.value;
      if (moviePosters[selectedMovie]) {
        moviePoster.src = moviePosters[selectedMovie];
      }
    });
  }
  
  // 设置运动会按钮
  function setupGamesButton() {
    const startGamesButton = document.getElementById('start-games');
    const gameResults = document.getElementById('game-results');
    const winningFamily = document.getElementById('winning-family');
    if (!startGamesButton || !gameResults || !winningFamily) return;
    
    startGamesButton.addEventListener('click', function() {
      // 模拟比赛进行中
      startGamesButton.disabled = true;
      startGamesButton.textContent = '比赛进行中...';
      
      // 随机选择获胜家庭
      const families = ['张家', '李家', '王家', '刘家'];
      const randomIndex = Math.floor(Math.random() * families.length);
      
      // 2秒后显示结果
      setTimeout(function() {
        winningFamily.textContent = families[randomIndex];
        gameResults.classList.remove('d-none');
        startGamesButton.textContent = '再来一次';
        startGamesButton.disabled = false;
      }, 2000);
    });
  }
  
  // 设置沙堡画布
  function setupSandcastleCanvas() {
    const canvas = document.getElementById('sandcastle-canvas');
    if (!canvas) return;
    
    // 获取上下文
    const ctx = canvas.getContext('2d');
    
    // 设置画布大小以匹配显示大小
    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 150; // 固定高度
    }
    
    // 初始调整大小
    resizeCanvas();
    
    // 窗口大小变化时调整
    window.addEventListener('resize', resizeCanvas);
    
    // 绘图变量
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    // 开始绘制
    canvas.addEventListener('mousedown', (e) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
    });
    
    // 绘制中
    canvas.addEventListener('mousemove', (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0077b6';
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      [lastX, lastY] = [x, y];
    });
    
    // 结束绘制
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);
    
    // 移动设备支持
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      [lastX, lastY] = [touch.clientX - rect.left, touch.clientY - rect.top];
      isDrawing = true;
    });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0077b6';
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      [lastX, lastY] = [x, y];
    });
    
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      isDrawing = false;
    });
  }
  
  // 清空沙堡画布
  function clearCanvas() {
    const canvas = document.getElementById('sandcastle-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  // 保存沙堡设计
  function saveCanvas() {
    const canvas = document.getElementById('sandcastle-canvas');
    if (!canvas) return;
    
    // 创建通知
    const container = canvas.parentElement;
    const notification = document.createElement('div');
    notification.className = 'alert alert-success mt-2';
    notification.textContent = '设计已保存！';
    notification.style.fontSize = '0.9rem';
    notification.style.padding = '0.5rem';
    
    // 添加通知
    container.appendChild(notification);
    
    // 2秒后移除通知
    setTimeout(() => {
      notification.remove();
    }, 2000);
    
    // 实际项目中，可以将画布数据保存到本地存储
    const imageData = canvas.toDataURL('image/png');
    localStorage.setItem('sandcastle-design', imageData);
  }
  
  // 设置更多照片按钮
  function setupMorePhotosButton() {
    const morePhotosButton = document.getElementById('more-photos');
    if (!morePhotosButton) return;
    
    // 额外照片数据
    const additionalPhotos = [
      {
        url: 'https://z1.ax1x.com/2023/09/18/pPqEXtg.jpg',
        caption: '山海关长城'
      },
      {
        url: 'https://z1.ax1x.com/2023/09/18/pPqEzp8.jpg',
        caption: '春季花海'
      },
      {
        url: 'https://z1.ax1x.com/2023/09/18/pPqVvoq.jpg',
        caption: '亲子户外活动'
      }
    ];
    
    morePhotosButton.addEventListener('click', function() {
      const galleryContainer = document.getElementById('gallery-container');
      if (!galleryContainer) return;
      
      // 加载中状态
      morePhotosButton.disabled = true;
      morePhotosButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 加载中...';
      
      // 模拟加载延迟
      setTimeout(() => {
        // 添加额外照片
        additionalPhotos.forEach((photo, index) => {
          const colDiv = document.createElement('div');
          colDiv.className = 'col-md-4 mb-4';
          colDiv.setAttribute('data-aos', 'fade-up');
          colDiv.setAttribute('data-aos-delay', index * 100);
          
          colDiv.innerHTML = `
            <div class="gallery-item">
              <img src="${photo.url}" alt="${photo.caption}" class="img-fluid rounded">
              <div class="gallery-caption">${photo.caption}</div>
            </div>
          `;
          
          galleryContainer.appendChild(colDiv);
        });
        
        // 更新按钮
        morePhotosButton.innerHTML = '已显示全部照片';
        morePhotosButton.disabled = true;
        
        // 刷新AOS动画
        AOS.refresh();
      }, 1000);
    });
  }
  
  // 设置复选框本地存储
  function setupChecklistStorage() {
    const checkboxes = document.querySelectorAll('.form-check-input[type="checkbox"]');
    if (checkboxes.length === 0) return;
    
    // 加载保存的状态
    checkboxes.forEach(checkbox => {
      const savedState = localStorage.getItem(`checklist-${checkbox.id}`);
      if (savedState === 'true') {
        checkbox.checked = true;
      }
      
      // 保存状态变化
      checkbox.addEventListener('change', function() {
        localStorage.setItem(`checklist-${this.id}`, this.checked);
      });
    });
  }
  