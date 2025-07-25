// Initialize Supabase client with your project credentials
const supabaseUrl = 'https://ebhkbcfcomwyewbpycvm.supabase.co';
const supabaseKey =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViaGtiY2Zjb213eWV3YnB5Y3ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MjUyMTUsImV4cCI6MjA2OTAwMTIxNX0.SkPkOVjVWBTtIyqERSP7NyNPKTwgC67gjVTT_Hv0q04.gmFe6VIcbyzNIzRmSnbyMdIP8rFuRLXw31QKbsjZ--Q';
const { createClient } = supabase;
const client = createClient(supabaseUrl, supabaseKey);

// Check and display user profile if logged in
async function displayUserProfile() {
	try {
		const {
			data: { user },
			error,
		} = await client.auth.getUser();
		if (error) throw error;
		console.log(user);
		if (user) {
			if (document.getElementById('profile-avatar')) {
				document.getElementById('profile-avatar').src =
					user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp';
				document.getElementById('profile-name').textContent = user.user_metadata?.full_name || user.email;
				document.getElementById('profile-email').textContent = user.email;
			}
			console.log(window.location.pathname.includes('index.html'));
			// todo
			if (window.location.pathname.includes('index.html')) {
				window.location.href = 'post.html';
			}
		} else if (!window.location.pathname.includes('index.html') && !window.location.pathname.includes('login.html')) {
			window.location.href = 'index.html';
		}
	} catch (error) {
		console.error('Error:', error);
		if (!window.location.pathname.includes('index.html') && !window.location.pathname.includes('login.html')) {
			window.location.href = 'index.html';
		}
	}
}

// Set up password visibility toggle
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('signup-password');
const eyeIcon = document.getElementById('eyeIcon');

if (togglePassword && passwordInput && eyeIcon) {
	togglePassword.addEventListener('click', () => {
		const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
		passwordInput.setAttribute('type', type);
		eyeIcon.classList.toggle('fa-eye');
		eyeIcon.classList.toggle('fa-eye-slash');
	});
}

// Handle signup form submission
const signupBtn = document.getElementById('signupBtn');
signupBtn &&
	signupBtn.addEventListener('click', async () => {
		const email = document.getElementById('signup-email');
		const password = document.getElementById('signup-password');

		if (email && password) {
			try {
				const { data, error } = await client.auth.signUp({
					email: email.value,
					password: password.value,
				});
				if (data) window.location.href = 'post.html';

				if (error) throw error;
			} catch (error) {
				console.error('Signup error:', error);
				if (error.message.includes('invalid format')) {
					alert('Please enter a valid email address');
				}
			}
		} else {
			if (email) {
				alert('Please your password');
			} else {
				alert('Please your email');
			}
		}
	});

// Handle login form submission
const loginBtn = document.getElementById('loginBtn');
loginBtn &&
	loginBtn.addEventListener('click', async () => {
		const email = document.getElementById('login-email');
		const password = document.getElementById('login-password');

		if (email && password) {
			try {
				const { data, error } = await client.auth.signInWithPassword({
					email: email.value,
					password: password.value,
				});
				if (data) window.location.href = 'post.html';
				if (error) throw error;
			} catch (error) {
				console.error('Login error:', error);
				if (error.message.includes('invalid format')) {
					alert('Please enter a valid email address');
				}
			}
		} else {
			alert('Please fill all fields');
		}
	});

// Handle Google login
const loginWithGoogle = document.getElementById('loginWithGoogle');
loginWithGoogle &&
	loginWithGoogle.addEventListener('click', async () => {
		try {
			const redirectTo = window.location.hostname ===  "127.0.0.1:5500"
            ?window.location.origin + "/post.html"
            :window.location.origin + "/post-application/"
			
            const {error} = await client.auth.signInWithOAuth({
                provider:google
            })
            
            if (error) throw error;
		} catch (error) {
			console.error('Google login error:', error);
			alert(error.message || 'Google login failed');
		}
	});

// Handle logout
const logoutBtn = document.getElementById('logoutBtn');
logoutBtn &&
	logoutBtn.addEventListener('click', async () => {
		try {
			const { error } = await client.auth.signOut();
			if (error) throw error;
			window.location.href = 'index.html';
		} catch (error) {
			console.error('Logout error:', error);
			alert('Logout failed');
		}
	});

// Check for returning Google OAuth redirect
document.addEventListener('DOMContentLoaded', async () => {
	if (window.location.hash.includes('access_token')) {
		const {
			data: { session },
		} = await client.auth.getSession();
		if (session) window.location.href = 'post.html';
	}
	if (!window.location.pathname.includes('index.html') && !window.location.pathname.includes('login.html')) {
		displayUserProfile();
	}
});

// add a post
const submitPost = document.getElementById('submitPost');
const loaderOverlay = document.getElementById('loader-overlay');

function showLoader() {
	loaderOverlay.style.display = 'flex';
}

function hideLoader() {
	loaderOverlay.style.display = 'none';
}

submitPost &&
	submitPost.addEventListener('click', async () => {
		const userTitle = document.getElementById('post-title').value.trim();
		const userDescription = document.getElementById('postdescrib').value.trim();

		if (!userTitle || !userDescription) {
			Swal.fire({
				icon: 'warning',
				title: 'Missing Fields',
				text: 'Please enter both a title and a description.',
				confirmButtonColor: '#125b9a',
			});
			return;
		}

		showLoader();
		submitPost.disabled = true;

		try {
			const {
				data: { user },
				error: authError,
			} = await client.auth.getUser();

			if (authError || !user) throw authError || new Error('User not found.');

			const { data, error } = await client.from('posts').insert({
				user_id: user.id,
				title: userTitle,
				description: userDescription,
			});

			if (error) {
				console.error(error);
				Swal.fire({
					icon: 'error',
					title: 'Post Failed',
					text: 'There was a problem creating the post.',
					confirmButtonColor: '#125b9a',
				});
			} else {
				Swal.fire({
					icon: 'success',
					title: 'Post Created',
					text: 'Your post has been successfully created!',
					timer: 1500,
					showConfirmButton: false,
				});
				document.getElementById('post-title').value = '';
				document.getElementById('postdescrib').value = '';
			}
		} catch (err) {
			console.error(err);
			Swal.fire({
				icon: 'error',
				title: 'Unexpected Error',
				text: 'Something went wrong. Please try again.',
				confirmButtonColor: '#125b9a',
			});
		} finally {
			hideLoader();
			submitPost.disabled = false;
		}
	});

//read all posts

if (window.location.pathname == '/all-blogs.html') {
	const current = document.getElementById('current');
	current.style.textDecoration = 'underline red';

	try {
		const readAllPosts = async () => {
			const { data, error } = await client.from('posts').select();
			if (data) {
				const box = document.getElementById('container');
				console.log(box);

				box.innerHTML = data
					.map(
						({ id, title, description }) => `<div id='${id}' class="card bg-info text-white" style="width: 18rem;">
						<div class="card-body">
							<h5 class="card-title">${title}</h5>

							<p class="card-text">${description} </p>

						</div>
					</div>`,
					)
					.join('');
			} else {
				console.log(error);
			}
		};
		readAllPosts();
	} catch (error) {
		console.log(error);
	}
}

//read my posts
const readMyPosts = async () => {
	const {
		data: { user },
	} = await client.auth.getUser();
	const { data, error } = await client.from('posts').select().eq('user_id', user.id);
	console.log(data);
	if (data) {
		const box = document.getElementById('container');
		console.log(box);

		box.innerHTML = data
			.map(
				({ id, title, description }) => `<div id='${id}' class="card bg-info text-white" style="width: 18rem;">
						<div class="card-body">
							<h5 class="card-title">${title}</h5>

							<p class="card-text">${description} </p>

						</div>
						<div class="d-flex gap-4 px-4">
						<button type="button" onclick="updatePost('${id}','${title}','${description}')" class="btn btn-success">Edit</button>
						<button type="button" onclick="deletePost('${id}')"  class="btn btn-danger">Delete</button></div>
					</div>`,
			)
			.join('');
	} else {
		console.log(error);
	}
};
if (window.location.pathname == '/my-blogs.html') {
	const current = document.getElementById('active');
	current.style.textDecoration = 'underline red';

	try {
		readMyPosts();
	} catch (error) {
		console.log(error);
	}
}

//delete a post

async function deletePost(postId) {
	const swalWithBootstrapButtons = Swal.mixin({
		customClass: {
			confirmButton: 'btn btn-success',
			cancelButton: 'btn btn-danger',
		},
		buttonsStyling: false,
	});
	swalWithBootstrapButtons
		.fire({
			title: 'Are you sure?',
			text: "You won't be able to revert this!",
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Yes, delete it!',
			cancelButtonText: 'No, cancel!',
			reverseButtons: true,
		})
		.then(async (result) => {
			if (result.isConfirmed) {
				try {
					showLoader();
					const response = await client.from('posts').delete().eq('id', postId);
					if (response) {
						hideLoader();
						alert('post has been deleted');
						console.log(response);
						readMyPosts();
					} else {
						console.log(error);
					}
				} catch (error) {
					console.log(error);
				} finally {
					hideLoader();
				}

				swalWithBootstrapButtons.fire({
					title: 'Deleted!',
					text: 'Your file has been deleted.',
					icon: 'success',
				});
			} else if (
				/* Read more about handling dismissals below */
				result.dismiss === Swal.DismissReason.cancel
			) {
				swalWithBootstrapButtons.fire({
					title: 'Cancelled',
					text: 'Your imaginary file is safe :)',
					icon: 'error',
				});
			}
		});
}

//update post

async function updatePost(postId, postTitle, postDescription) {
	const { value: formValues } = await Swal.fire({
		title: 'Update post',
		html: `
    <label > post title
	<input id="swal-input1" class="swal1-input"  value = '${postTitle}' ></label>
    <label > post description
	<input id="swal-input2" class="swal2-input" style="margin: 0 !important;"   value = '${postDescription}' ></label>
  `,
		focusConfirm: false,
		preConfirm: () => {
			return [document.getElementById('swal-input1').value, document.getElementById('swal-input2').value];
		},
	});
	try {
		if (formValues) {
			showLoader();
			const [updatedTitle, updatedDescription] = formValues;
			const { error } = await client
				.from('posts')
				.update({ title: updatedTitle, description: updatedDescription })
				.eq('id', postId);

			if (error) {
				console.log(error);
			} else {
				hideLoader();

				Swal.fire({
					icon: 'success',
					title: 'your post has been updated',
					confirmButtonColor: '#125b9a',
				});
				readMyPosts();
			}
		}
	} catch (error) {
		console.log(error);
	} finally {
		hideLoader();
	}
}